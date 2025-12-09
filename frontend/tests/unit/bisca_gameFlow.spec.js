import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mocks hoisted para as stores usadas dentro da biscaStore
const authStoreMock = vi.hoisted(() => ({
  isLoggedIn: true,
  refreshUser: vi.fn(),
  currentUser: { id: 123 },
}))

const apiStoreMock = vi.hoisted(() => ({
  postMatch: vi.fn(),
  postGame: vi.fn(),
  postStandalone: vi.fn(),
  updateMatch: vi.fn(),
  postAwardMatchReward: vi.fn(),
  postDeductEntryFee: vi.fn(),
}))

vi.mock('@/stores/auth', () => {
  return {
    useAuthStore: () => authStoreMock,
  }
})

vi.mock('@/stores/api', () => {
  return {
    useAPIStore: () => apiStoreMock,
  }
})

// IMPORTA a store depois dos mocks
import { useBiscaStore } from '@/stores/bisca'

describe('Bisca game flow (jogar cartas e contar vazas)', () => {
  let bisca

  beforeEach(() => {
    setActivePinia(createPinia())
    bisca = useBiscaStore()

    // reset mocks só por segurança
    authStoreMock.isLoggedIn = true
    authStoreMock.refreshUser = vi.fn()
  })

  it('startGame inicializa o jogo com o número certo de cartas, trunfo e stock', () => {
    bisca.variant = '3' // mão de 3 cartas
    bisca.gameType = 'standalone'
    bisca.mode = 'practice'

    bisca.startGame()

    // estado base
    expect(bisca.status).toBe('in_game')
    expect(bisca.phase).toBe('draw_phase')
    expect(bisca.playerPoints).toBe(0)
    expect(bisca.botPoints).toBe(0)

    // mãos + trunfo + stock
    expect(bisca.playerHand.length).toBe(3)
    expect(bisca.botHand.length).toBe(3)
    expect(bisca.trumpCard).not.toBeNull()
    expect(bisca.stock.length).toBe(34)

    // timestamps
    expect(bisca.beganAt).not.toBeNull()
    expect(bisca.endedAt).toBeNull()
  })

  it('playCard remove a carta da mão do player, mete na mesa e passa a vez para o bot', () => {
    bisca.status = 'in_game'
    bisca.currentTurn = 'player'

    const card = {
      id: 1,
      suit: '♥',
      rank: 1,
      points: 11,
    }

    // player tem a carta, bot ainda não jogou
    bisca.playerHand = [card]
    bisca.botHand = []
    bisca.tableCards = { player: null, bot: null }

    // usamos fake timers só para evitar o setTimeout tocar no botPlay
    vi.useFakeTimers()

    bisca.playCard(card)

    // carta foi removida da mão do player
    expect(bisca.playerHand).toHaveLength(0)

    // carta foi colocada na mesa
    expect(bisca.tableCards.player).toMatchObject({ id: 1, suit: '♥', points: 11 })

    // vez passou para o bot
    expect(bisca.currentTurn).toBe('bot')

    vi.useRealTimers()
  })

  it('resolveTrick contabiliza corretamente a vaza quando o player ganha', () => {
    bisca.status = 'in_game'
    bisca.trumpCard = { id: 100, suit: '♠', rank: 7, points: 10, strength: 9 }
    bisca.trickLeader = 'player'

    // começar sem pontos / vazas
    bisca.playerPoints = 0
    bisca.botPoints = 0
    bisca.collectedTricksPlayer = []
    bisca.collectedTricksBot = []

    // ainda há cartas na mão e no stock → o jogo não acaba
    bisca.playerHand = [{ id: 3, suit: '♣', rank: 3, points: 0, strength: 2 }]
    bisca.botHand = [{ id: 4, suit: '♦', rank: 4, points: 0, strength: 3 }]
    bisca.stock = [{ id: 5, suit: '♣', rank: 5, points: 0, strength: 4 }]

    // 👉 agora com strength definido, alinhado com o baralho real
    const playerCard = { id: 1, suit: '♥', rank: 1, points: 11, strength: 10 } // Ás, mais forte
    const botCard = { id: 2, suit: '♥', rank: 11, points: 3, strength: 6 }     // Valete, mais fraco

    bisca.tableCards = {
      player: playerCard,
      bot: botCard,
    }

    // resolve a vaza
    bisca.resolveTrick()
    // simula o fim da animação (limpa mesa + compra cartas + prepara próxima jogada)
    bisca.afterTrickAnimation()

    // vaza vai para o player
    expect(bisca.collectedTricksPlayer).toHaveLength(2)
    expect(bisca.collectedTricksPlayer).toEqual(
      expect.arrayContaining([playerCard, botCard]),
    )
    expect(bisca.collectedTricksBot).toHaveLength(0)

    // pontos somados corretamente
    expect(bisca.playerPoints).toBe(playerCard.points + botCard.points)
    expect(bisca.botPoints).toBe(0)

    // mesa limpa (feito em afterTrickAnimation)
    expect(bisca.tableCards.player).toBeNull()
    expect(bisca.tableCards.bot).toBeNull()

    // ainda não é fim de jogo → próxima jogada começa no vencedor
    expect(['player', 'bot']).toContain(bisca.currentTurn)
  })

  it('resolveTrick contabiliza corretamente a vaza quando o bot ganha', () => {
    bisca.status = 'in_game'
    bisca.trumpCard = { id: 200, suit: '♠', rank: 7, points: 10, strength: 9 }
    bisca.trickLeader = 'player'

    bisca.playerPoints = 0
    bisca.botPoints = 0
    bisca.collectedTricksPlayer = []
    bisca.collectedTricksBot = []

    // manter jogo a decorrer
    bisca.playerHand = [{ id: 3, suit: '♣', rank: 3, points: 0, strength: 2 }]
    bisca.botHand = [{ id: 4, suit: '♦', rank: 4, points: 0, strength: 3 }]
    bisca.stock = [{ id: 5, suit: '♦', rank: 5, points: 0, strength: 4 }]

    const playerCard = { id: 1, suit: '♥', rank: 11, points: 3, strength: 6 }  // Valete, mais fraco
    const botCard = { id: 2, suit: '♥', rank: 1, points: 11, strength: 10 }    // Ás, mais forte

    bisca.tableCards = {
      player: playerCard,
      bot: botCard,
    }

    bisca.resolveTrick()
    bisca.afterTrickAnimation()

    // vaza vai para o bot
    expect(bisca.collectedTricksBot).toHaveLength(2)
    expect(bisca.collectedTricksBot).toEqual(
      expect.arrayContaining([playerCard, botCard]),
    )
    expect(bisca.collectedTricksPlayer).toHaveLength(0)

    // pontos somados corretamente
    expect(bisca.botPoints).toBe(playerCard.points + botCard.points)
    expect(bisca.playerPoints).toBe(0)

    // mesa limpa (feito em afterTrickAnimation)
    expect(bisca.tableCards.player).toBeNull()
    expect(bisca.tableCards.bot).toBeNull()
  })


  it('não deixa o player jogar carta se não for a vez dele', () => {
    bisca.status = 'in_game'
    bisca.currentTurn = 'bot' // não é a vez do player

    const card = { id: 10, suit: '♣', rank: 3, points: 0 }
    bisca.playerHand = [card]
    bisca.tableCards = { player: null, bot: null }

    bisca.playCard(card)

    // nada mudou
    expect(bisca.playerHand).toHaveLength(1)
    expect(bisca.tableCards.player).toBeNull()
    expect(bisca.currentTurn).toBe('bot')
  })
})
