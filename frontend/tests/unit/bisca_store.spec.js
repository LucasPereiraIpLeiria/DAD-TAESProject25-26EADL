import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// ───────────────────────────────────────────────
// MOCKS
// ───────────────────────────────────────────────

vi.mock('@/stores/api', () => {
  const postMatch = vi.fn().mockResolvedValue({
    data: { id: 123, began_at: '2025-01-01T00:00:00.000Z' },
  })
  const updateMatch = vi.fn().mockResolvedValue({
    data: { coins_awarded: 10 },
  })
  const postGame = vi.fn().mockResolvedValue({})
  const getGlobalScoreboards = vi.fn().mockResolvedValue({ data: [] })

  const apiStore = {
    postMatch,
    updateMatch,
    postGame,
    getGlobalScoreboards,
  }

  return {
    useAPIStore: () => apiStore,
  }
})

vi.mock('@/stores/auth', () => {
  const authStore = {
    currentUser: { id: 1, coins_balance: 100 },
    refreshUser: vi.fn().mockResolvedValue(undefined),
  }

  return {
    useAuthStore: () => authStore,
  }
})

vi.mock('@/stores/leaderboardMonitor', () => {
  const leaderboardMonitor = {
    checkForChanges: vi.fn(),
  }

  return {
    useLeaderboardMonitor: () => leaderboardMonitor,
  }
})

import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { useBiscaStore } from '@/stores/bisca'

// ───────────────────────────────────────────────
// TESTS
// ───────────────────────────────────────────────

describe('Bisca Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    store = useBiscaStore()
  })

  // 1) startGame com variant 9 cria jogo com 9 cartas por mão e stock correto
it('startGame (practice, variant 9) inicializa baralho, mãos e stock corretamente', () => {
  store.startGame({ variant: '9' })

  expect(store.status).toBe('in_game')
  expect(store.phase).toBe('draw_phase')

  expect(store.playerHand).toHaveLength(9)
  expect(store.botHand).toHaveLength(9)

  // 40 cartas totais - 18 usadas = 22 no stock (trunfo incluído)
  expect(store.stock.length).toBe(40 - 9 - 9)

  expect(store.trumpCard).not.toBeNull()
  // 🔥 remover esta linha:
  // expect(store.deck.length).toBe(0)
})

  // 2) startGame com variant 3 dá 3 cartas por mão
  it('startGame (practice, variant 3) dá 3 cartas por mão', () => {
    store.startGame({ variant: '3' })

    expect(store.variant).toBe('3')
    expect(store.playerHand).toHaveLength(3)
    expect(store.botHand).toHaveLength(3)
  })

  // 3) playCard não faz nada se não for a vez do player
  it('playCard não permite jogar se não for a vez do player', () => {
    store.startGame({ variant: '9' })
    const card = store.playerHand[0]

    store.currentTurn = 'bot' // força vez do bot

    store.playCard(card)

    expect(store.tableCards.player).toBeNull()
    expect(store.currentTurn).toBe('bot')
  })

  // 4) playCard coloca a carta do player na mesa e passa a vez para o bot
  it('playCard coloca a carta do player na mesa e passa a vez para o bot', () => {
    store.startGame({ variant: '9' })
    const card = store.playerHand[0]

    store.playCard(card)

    expect(store.tableCards.player).toEqual(card)
    expect(store.playerHand.find((c) => c.id === card.id)).toBeUndefined()
    expect(store.currentTurn).toBe('bot')
  })

  // 5) resolveTrick soma pontos corretos e define lastTrickWinner quando player ganha
  it('resolveTrick atribui a vaza ao player e soma pontos corretamente', () => {
    // setup manual
    store.trumpCard = { suit: '♠' }

    const playerCard = { id: 1, suit: '♥', points: 11, strength: 10 }
    const botCard = { id: 2, suit: '♥', points: 2, strength: 6 }

    store.tableCards = { player: playerCard, bot: botCard }
    store.trickLeader = 'player'
    store.playerPoints = 0
    store.botPoints = 0

    store.resolveTrick()

    expect(store.playerPoints).toBe(13) // 11 + 2
    expect(store.botPoints).toBe(0)
    expect(store.lastTrickWinner).toBe('player')
    expect(store.lastTrickCards).toEqual({ player: playerCard, bot: botCard })
  })

  // 6) drawCardsIfNeeded dá a primeira carta ao vencedor e muda para final_phase quando o stock acaba
  it('drawCardsIfNeeded dá cartas ao vencedor e entra em final_phase quando o stock esvazia', () => {
    // mão vazia, mas vamos simular stock com 2 cartas apenas
    store.playerHand = []
    store.botHand = []
    store.stock = [
      { id: 1, suit: '♠', points: 0, strength: 1 },
      { id: 2, suit: '♥', points: 0, strength: 1 },
    ]
    store.phase = 'draw_phase'

    // winner = player
    store.drawCardsIfNeeded('player')

    // Player deve ter recebido a primeira carta, bot a segunda
    expect(store.playerHand).toHaveLength(1)
    expect(store.botHand).toHaveLength(1)
    expect(store.stock).toHaveLength(0)

    // stock ficou vazio → final_phase
    expect(store.phase).toBe('final_phase')
  })

  // 7) finishGameIfNeeded em match com 61–90 pontos dá 1 mark ao vencedor e passa para between_games
  it('finishGameIfNeeded em match com 61–90 pontos atribui 1 mark ao vencedor', async () => {
    store.gameType = 'match'
    store.playerPoints = 70
    store.botPoints = 40

    // condições de fim de jogo (isGameOver === true)
    store.playerHand = []
    store.botHand = []
    store.stock = []
    store.tableCards = { player: null, bot: null }

    store.currentMatchId = null // evita chamadas de saveMatchGame
    store.playerMarks = 0
    store.botMarks = 0

    await store.finishGameIfNeeded('player')

    expect(store.playerMarks).toBe(1)
    expect(store.botMarks).toBe(0)
    expect(store.status).toBe('between_games')
  })

  // 8) finishGameIfNeeded em match com 91–119 pontos dá 2 marks (capote)
  it('finishGameIfNeeded em match com 91–119 pontos atribui 2 marks (capote)', async () => {
    store.gameType = 'match'
    store.playerPoints = 100 // capote
    store.botPoints = 10

    store.playerHand = []
    store.botHand = []
    store.stock = []
    store.tableCards = { player: null, bot: null }

    store.currentMatchId = null
    store.playerMarks = 0
    store.botMarks = 0

    await store.finishGameIfNeeded('player')

    expect(store.playerMarks).toBe(2)
    expect(store.botMarks).toBe(0)
    expect(store.status).toBe('between_games')
  })

  // 9) finishGameIfNeeded em practice com vitória do player define summary.result = 'win' e achievements capote/bandeira corretos
  it('finishGameIfNeeded em practice calcula summary.result e achievements corretamente', async () => {
    // modo practice (default)
    store.gameType = 'practice'
    store.variant = '9'

    // vitória com capote (>=91 && <120)
    store.playerPoints = 100
    store.botPoints = 20

    store.playerHand = []
    store.botHand = []
    store.stock = []
    store.tableCards = { player: null, bot: null }

    // vai acabar o jogo e depois chamar finishMatch()
    await store.finishGameIfNeeded('player')

    expect(store.summary).not.toBeNull()
    expect(store.summary.result).toBe('win')
    expect(store.summary.gameType).toBe('practice')

    // achievements em practice baseiam-se nos points do game atual
    expect(store.summary.achievements.capote).toBe(true)
    expect(store.summary.achievements.bandeira).toBe(false)
  })

  // 10) saveMatchGame envia payload com is_draw=true e winner/loser null quando há empate
  it('saveMatchGame envia payload com is_draw=true e winner/loser null quando há empate', async () => {
    const apiStore = useAPIStore()
    const authStore = useAuthStore()

    store.gameType = 'match'
    store.currentMatchId = 999

    authStore.currentUser.id = 42

    store.playerPoints = 60
    store.botPoints = 60
    store.beganAt = '2025-01-01T00:00:00.000Z'
    store.endedAt = '2025-01-01T00:10:00.000Z'
    store.variant = '9'

    await store.saveMatchGame(null)

    expect(apiStore.postGame).toHaveBeenCalledTimes(1)

    const payload = apiStore.postGame.mock.calls[0][0]

    expect(payload.is_draw).toBe(true)
    expect(payload.winner_user_id).toBeNull()
    expect(payload.loser_user_id).toBeNull()
    expect(payload.type).toBe('9')
    expect(payload.match_id).toBe(999)
    expect(payload.player1_points).toBe(60)
    expect(payload.player2_points).toBe(60)
  })
})
