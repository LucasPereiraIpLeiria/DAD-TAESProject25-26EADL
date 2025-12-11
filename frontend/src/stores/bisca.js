import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { useLeaderboardMonitor } from '@/stores/leaderboardMonitor'

export const useBiscaStore = defineStore('bisca', () => {
  const apiStore = useAPIStore()
  const authStore = useAuthStore()
  const leaderboardMonitor = useLeaderboardMonitor()
  // ───────────────────────────────────────────────
  // STATE
  // ───────────────────────────────────────────────

  const gameType = ref('practice') // 'practice' | 'match'
  const variant = ref('9') // '3' | '9'

  const status = ref('idle') // 'idle' | 'in_game' | 'between_games' | 'match_finished'

  const deck = ref([])
  const stock = ref([])
  const trumpCard = ref(null)

  const playerHand = ref([])
  const botHand = ref([])

  const tableCards = ref({
    player: null,
    bot: null,
  })

  const collectedTricksPlayer = ref([])
  const collectedTricksBot = ref([])

  const playerPoints = ref(0)
  const botPoints = ref(0)

  const playerMarks = ref(0)
  const botMarks = ref(0)

  const currentGameNumber = ref(1)
  const currentTurn = ref('player') // 'player' | 'bot'
  const phase = ref('draw_phase') // 'draw_phase' | 'final_phase'

  const summary = ref(null)

  const beganAt = ref(null)
  const endedAt = ref(null)

  const matchBeganAt = ref(null)
  const matchEndedAt = ref(null)

  const currentMatchId = ref(null)
  const matchPlayer1Points = ref(0)
  const matchPlayer2Points = ref(0)

  const matchGames = ref([]) // [{ gameNumber, playerPoints, botPoints, winner, achievements }]

  const trickLeader = ref('player')
  const lastTrickWinner = ref(null) // 'player' | 'bot' | null
  const lastTrickCards = ref({
    player: null,
    bot: null,
  })
  const lastTrickToken = ref(0)

  // ───────────────────────────────────────────────
  // COMPUTED
  // ───────────────────────────────────────────────

  const isDrawPhase = computed(() => phase.value === 'draw_phase')
  const isFinalPhase = computed(() => phase.value === 'final_phase')

  const isGameOver = computed(() => {
    return (
      playerHand.value.length === 0 &&
      botHand.value.length === 0 &&
      stock.value.length === 0 &&
      tableCards.value.player === null &&
      tableCards.value.bot === null
    )
  })

  const isMatchFinished = computed(() => {
    return playerMarks.value >= 4 || botMarks.value >= 4
  })

  // ───────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────

  function createDeck() {
    const suits = ['♠', '♥', '♦', '♣']
    const ranks = [
      { rank: 1, points: 11, strength: 10 }, // Ás
      { rank: 7, points: 10, strength: 9 }, // 7
      { rank: 13, points: 4, strength: 8 }, // K
      { rank: 12, points: 3, strength: 7 }, // Q
      { rank: 11, points: 2, strength: 6 }, // J
      { rank: 6, points: 0, strength: 5 },
      { rank: 5, points: 0, strength: 4 },
      { rank: 4, points: 0, strength: 3 },
      { rank: 3, points: 0, strength: 2 },
      { rank: 2, points: 0, strength: 1 },
    ]

    const d = []
    let id = 1
    for (const suit of suits) {
      for (const r of ranks) {
        d.push({
          id: id++,
          suit,
          rank: r.rank,
          points: r.points,
          strength: r.strength,
        })
      }
    }
    return d
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  function scheduleBotStartIfNeeded() {
    if (
      status.value === 'in_game' &&
      currentTurn.value === 'bot' &&
      !tableCards.value.player &&
      !tableCards.value.bot &&
      botHand.value.length > 0
    ) {
      setTimeout(() => {
        botPlay()
      }, 1000)
    }
  }

  function applyConfig(config) {
    if (!config) return

    if (config.gametype === 'practice' || config.gametype === 'match') {
      gameType.value = config.gametype
    }

    if (config.variant === '3' || config.variant === '9') {
      variant.value = config.variant
    }
  }

  // ───────────────────────────────────────────────
  // MATCH FLOW
  // ───────────────────────────────────────────────

  async function startMatch({ gametype, variant: v } = {}) {
    // match é sempre gametype = 'match'
    applyConfig({
      gametype: 'match',
      variant: v,
    })

    resetMatch()
    gameType.value = 'match'

    currentGameNumber.value = 1
    playerMarks.value = 0
    botMarks.value = 0
    matchPlayer1Points.value = 0
    matchPlayer2Points.value = 0
    currentMatchId.value = null
    matchBeganAt.value = null
    matchEndedAt.value = null

    status.value = 'in_game'

    const p1 = authStore.currentUser?.id
    const p2 = 521
    const nowIso = new Date().toISOString()

    if (p1) {
      const matchPayload = {
        type: variant.value,
        player1_user_id: p1,
        player2_user_id: p2,
        status: 'Playing',
        stake: 1,
        began_at: nowIso,
      }

      try {
        const response = await apiStore.postMatch(matchPayload)
        currentMatchId.value = response.data.id
        matchBeganAt.value = response.data.began_at ?? nowIso
      } catch (error) {
        console.error('Failed to create match in API:', error)
      }
    }

    await startGame()
  }

  function resetMatch() {
    status.value = 'idle'
    summary.value = null

    deck.value = []
    stock.value = []
    trumpCard.value = null

    playerHand.value = []
    botHand.value = []

    playerPoints.value = 0
    botPoints.value = 0

    collectedTricksPlayer.value = []
    collectedTricksBot.value = []

    tableCards.value = {
      player: null,
      bot: null,
    }

    currentTurn.value = 'player'
    phase.value = 'draw_phase'
    trickLeader.value = 'player'
    matchGames.value = []

    matchPlayer1Points.value = 0
    matchPlayer2Points.value = 0
  }

  // ───────────────────────────────────────────────
  // GAME FLOW
  // ───────────────────────────────────────────────

  function startGame(config) {
    applyConfig(config || {})

    if (gameType.value === 'practice') {
      // jogo único, sem BD
      currentGameNumber.value = 1
      playerMarks.value = 0
      botMarks.value = 0
      matchPlayer1Points.value = 0
      matchPlayer2Points.value = 0
      currentMatchId.value = null
    } else if (gameType.value === 'match') {
      if (status.value === 'between_games') {
        currentGameNumber.value++
      }
    }

    status.value = 'in_game'
    phase.value = 'draw_phase'

    playerPoints.value = 0
    botPoints.value = 0
    collectedTricksPlayer.value = []
    collectedTricksBot.value = []

    tableCards.value = {
      player: null,
      bot: null,
    }

    trickLeader.value = 'player'

    deck.value = createDeck()
    shuffle(deck.value)

    const handSize = variant.value === '3' ? 3 : 9

    playerHand.value = deck.value.splice(0, handSize)
    botHand.value = deck.value.splice(0, handSize)

    trumpCard.value = deck.value[deck.value.length - 1]
    stock.value = deck.value
    deck.value = []

    currentTurn.value = 'player'
    beganAt.value = new Date().toISOString()
    endedAt.value = null
  }

  // ───────────────────────────────────────────────
  // PLAY FLOW
  // ───────────────────────────────────────────────

  function playCard(card) {
    if (status.value !== 'in_game') return
    if (currentTurn.value !== 'player') return
    if (!playerHand.value.some((c) => c.id === card.id)) return
    if (tableCards.value.player) return

    if (!tableCards.value.player && !tableCards.value.bot) {
      trickLeader.value = 'player'
    }

    if (isFinalPhase.value && tableCards.value.bot) {
      const leadingSuit = tableCards.value.bot.suit
      const hasSuit = playerHand.value.some((c) => c.suit === leadingSuit)
      if (hasSuit && card.suit !== leadingSuit) {
        console.warn('Jogador tem de seguir o naipe.')
        return
      }
    }

    playerHand.value = playerHand.value.filter((c) => c.id !== card.id)
    tableCards.value.player = card

    currentTurn.value = 'bot'

    if (tableCards.value.bot) {
      setTimeout(() => {
        resolveTrick()
      }, 1000)
    } else {
      setTimeout(() => {
        botPlay()
      }, 1000)
    }
  }

  function sortByStrengthAsc(cards) {
    return [...cards].sort((a, b) => a.strength - b.strength)
  }

  function chooseLowest(cards) {
    if (!cards.length) return null
    return sortByStrengthAsc(cards)[0]
  }

  function cardBeats(c1, c2, leadingSuit, trumpSuit) {
    if (c1.suit === trumpSuit && c2.suit !== trumpSuit) return true
    if (c2.suit === trumpSuit && c1.suit !== trumpSuit) return false

    if (c1.suit === c2.suit) {
      return c1.strength > c2.strength
    }

    if (c1.suit === leadingSuit && c2.suit !== leadingSuit) return true
    return false
  }

  // BOT AI
  function botPlay() {
    if (status.value !== 'in_game') return
    if (currentTurn.value !== 'bot') return

    const hand = botHand.value
    if (hand.length === 0) return

    const trumpSuit = trumpCard.value?.suit
    let cardToPlay = null

    if (!tableCards.value.player && !tableCards.value.bot) {
      cardToPlay = chooseLowest(hand)
      botHand.value = botHand.value.filter((c) => c.id !== cardToPlay.id)
      tableCards.value.bot = cardToPlay
      trickLeader.value = 'bot'
      currentTurn.value = 'player'
      return
    }

    const opponentCard = tableCards.value.player || tableCards.value.bot
    const leadingSuit = tableCards.value.player
      ? tableCards.value.player.suit
      : tableCards.value.bot.suit

    const sameSuitCards = hand.filter((c) => c.suit === leadingSuit)
    const trumpCards = hand.filter((c) => c.suit === trumpSuit)
    const otherCards = hand.filter((c) => c.suit !== leadingSuit && c.suit !== trumpSuit)

    if (isFinalPhase.value && sameSuitCards.length > 0) {
      const winners = sameSuitCards.filter((c) =>
        cardBeats(c, opponentCard, leadingSuit, trumpSuit),
      )
      if (winners.length > 0) {
        cardToPlay = chooseLowest(winners)
      } else {
        cardToPlay = chooseLowest(sameSuitCards)
      }
    } else {
      if (sameSuitCards.length > 0) {
        const winners = sameSuitCards.filter((c) =>
          cardBeats(c, opponentCard, leadingSuit, trumpSuit),
        )
        if (winners.length > 0) {
          cardToPlay = chooseLowest(winners)
        } else if (trumpCards.length > 0) {
          cardToPlay = chooseLowest(trumpCards)
        } else {
          const trash = [...sameSuitCards, ...otherCards, ...trumpCards]
          cardToPlay = chooseLowest(trash)
        }
      } else {
        if (trumpCards.length > 0) {
          cardToPlay = chooseLowest(trumpCards)
        } else {
          const trash = [...otherCards]
          cardToPlay = chooseLowest(trash)
        }
      }
    }

    if (!cardToPlay) {
      cardToPlay = hand[0]
    }

    botHand.value = botHand.value.filter((c) => c.id !== cardToPlay.id)
    tableCards.value.bot = cardToPlay

    setTimeout(() => {
      resolveTrick()
    }, 1000)
  }

  // ───────────────────────────────────────────────
  // RESOLVE TRICK
  // ───────────────────────────────────────────────

  function resolveTrick() {
    const p = tableCards.value.player
    const b = tableCards.value.bot
    if (!p || !b) return

    let winner = null
    const leadingSuit = trickLeader.value === 'player' ? p.suit : b.suit

    function beats(c1, c2) {
      if (c1.suit === trumpCard.value.suit && c2.suit !== trumpCard.value.suit) return true
      if (c2.suit === trumpCard.value.suit && c1.suit !== trumpCard.value.suit) return false

      if (c1.suit === c2.suit) {
        return c1.strength > c2.strength
      }

      if (c1.suit === leadingSuit && c2.suit !== leadingSuit) return true
      return false
    }

    const playerWins = beats(p, b)

    if (playerWins) {
      collectedTricksPlayer.value.push(p, b)
      playerPoints.value += p.points + b.points
      winner = 'player'
    } else {
      collectedTricksBot.value.push(p, b)
      botPoints.value += p.points + b.points
      winner = 'bot'
    }

    lastTrickCards.value = { player: p, bot: b }
    lastTrickWinner.value = winner
    lastTrickToken.value += 1
  }

  function afterTrickAnimation() {
    const winner = lastTrickWinner.value
    if (!winner) return

    tableCards.value = {
      player: null,
      bot: null,
    }

    drawCardsIfNeeded(winner)

    lastTrickWinner.value = null
    lastTrickCards.value = {
      player: null,
      bot: null,
    }
  }

  // ───────────────────────────────────────────────
  // DRAW CARDS
  // ───────────────────────────────────────────────

  function drawCardsIfNeeded(winner) {
    if (stock.value.length > 0) {
      if (winner === 'player') {
        const c1 = stock.value.shift()
        if (c1) playerHand.value.push(c1)
        const c2 = stock.value.shift()
        if (c2) botHand.value.push(c2)
      } else {
        const c1 = stock.value.shift()
        if (c1) botHand.value.push(c1)
        const c2 = stock.value.shift()
        if (c2) playerHand.value.push(c2)
      }

      if (stock.value.length === 0) {
        phase.value = 'final_phase'
      }
    }

    finishGameIfNeeded(winner)
  }

  // ───────────────────────────────────────────────
  // GAME AND MATCH END
  // ───────────────────────────────────────────────

  async function finishGameIfNeeded(winner) {
    if (!isGameOver.value) {
      currentTurn.value = winner
      trickLeader.value = winner
      scheduleBotStartIfNeeded()
      return
    }

    endedAt.value = new Date().toISOString()

    let gameWinner = null
    let gameWinnerPoints = 0

    if (playerPoints.value > botPoints.value) {
      gameWinner = 'player'
      gameWinnerPoints = playerPoints.value
    } else if (botPoints.value > playerPoints.value) {
      gameWinner = 'bot'
      gameWinnerPoints = botPoints.value
    } else {
      gameWinner = null // empate
    }

    if (gameType.value === 'match') {
      const playerWonGame = gameWinner === 'player'
      const gameAchievements = {
        bandeira: playerWonGame && playerPoints.value === 120,
        capote: playerWonGame && playerPoints.value >= 91 && playerPoints.value < 120,
      }

      matchGames.value.push({
        gameNumber: currentGameNumber.value,
        playerPoints: playerPoints.value,
        botPoints: botPoints.value,
        winner: gameWinner,
        achievements: gameAchievements,
      })
    }

    if (gameType.value === 'match') {
      matchPlayer1Points.value += playerPoints.value
      matchPlayer2Points.value += botPoints.value

      if (currentMatchId.value) {
        try {
          await saveMatchGame(gameWinner)
        } catch (error) {
          console.error('Failed to save match game:', error)
        }
      }
    }

    if (gameWinner) {
      if (gameWinnerPoints === 120) {
        if (gameWinner === 'player') {
          playerMarks.value = 4
        } else {
          botMarks.value = 4
        }
      } else if (gameWinnerPoints >= 91) {
        if (gameWinner === 'player') {
          playerMarks.value += 2
        } else {
          botMarks.value += 2
        }
      } else if (gameWinnerPoints >= 61) {
        if (gameWinner === 'player') {
          playerMarks.value += 1
        } else {
          botMarks.value += 1
        }
      }
    }

    if (gameType.value === 'practice') {
      await finishMatch()
      return
    }

    if (isMatchFinished.value) {
      await finishMatch()
    } else {
      status.value = 'between_games'
    }
  }

  function computeResult() {
    if (gameType.value === 'practice') {
      if (playerPoints.value > botPoints.value) return 'win'
      if (playerPoints.value < botPoints.value) return 'loss'
      return 'draw'
    }

    if (playerMarks.value > botMarks.value) return 'win'
    if (playerMarks.value < botMarks.value) return 'loss'
    return 'loss'
  }

  async function finishMatch() {
    status.value = 'match_finished'

    const result = computeResult()

    summary.value = {
      result,
      playerMarks: playerMarks.value,
      botMarks: botMarks.value,
      playerPoints: playerPoints.value,
      botPoints: botPoints.value,
      achievements: {
        capote: playerPoints.value >= 91 && playerPoints.value < 120,
        bandeira: playerPoints.value === 120,
      },
      gameType: gameType.value,
      variant: variant.value,
    }

    matchEndedAt.value = new Date().toISOString()

    if (summary.value.gameType === 'match' && currentMatchId.value) {
      try {
        const p1 = authStore.currentUser?.id
        const p2 = 521
        const winnerUserId = summary.value.result === 'win' ? p1 : p2
        const loserUserId = summary.value.result === 'win' ? p2 : p1

        const payload = {
          status: 'Ended',
          ended_at: matchEndedAt.value,
          winner_user_id: winnerUserId,
          loser_user_id: loserUserId,
          player1_marks: playerMarks.value,
          player2_marks: botMarks.value,
          player1_points: matchPlayer1Points.value,
          player2_points: matchPlayer2Points.value,
        }

        await apiStore.updateMatch(currentMatchId.value, payload)
      } catch (error) {
        console.error('Failed to update match in API:', error)
      }
    }

    await awardCoinsIfNeeded()

    try {
      // pede o scoreboard só da variante atual (3 ou 9)
      const resp = await apiStore.getGlobalScoreboards({ type: variant.value })
      // avisa o monitor indicando também a variante
      leaderboardMonitor.checkForChanges(resp.data, variant.value)
    } catch (err) {
      console.error('Failed to refresh global scoreboards after match:', err)
    }
  }

  async function awardCoinsIfNeeded() {
    const auth = useAuthStore()
    const api = useAPIStore()

    if (!auth.isLoggedIn) return
    if (gameType.value !== 'match') return
    if (!summary.value || summary.value.result !== 'win') return

    const payload = {
      result: summary.value.result,
      gametype: 'match',
      variant: summary.value.variant,
      player_marks: summary.value.playerMarks,
      bot_marks: summary.value.botMarks,
      player_points: summary.value.playerPoints,
      bot_points: summary.value.botPoints,
      capote: !!summary.value.achievements?.capote,
      bandeira: !!summary.value.achievements?.bandeira,
    }

    try {
      const response = await api.postAwardMatchReward(payload)
      const awarded = response.data?.meta?.coins_awarded ?? response.data?.coins_awarded ?? null

      await auth.refreshUser()

      if (awarded != null) {
        summary.value = {
          ...summary.value,
          coinsAwarded: awarded,
        }
      }
    } catch (error) {
      console.error('Failed to award coins:', error)
    }
  }

  function displayRank(rank) {
    switch (rank) {
      case 1:
        return 'A'
      case 13:
        return 'K'
      case 12:
        return 'Q'
      case 11:
        return 'J'
      default:
        return rank.toString()
    }
  }

  async function tryStartMatchEntry() {
    const auth = useAuthStore()
    const api = useAPIStore()

    if (!auth.isLoggedIn) {
      return { ok: false, reason: 'not_authenticated' }
    }

    try {
      await api.postDeductEntryFee({ gametype: 'match' })
      await auth.refreshUser()
      return { ok: true }
    } catch (error) {
      const res = error.response?.data
      const reason = res?.reason ?? res?.data?.reason
      if (reason === 'insufficient_funds') {
        return { ok: false, reason: 'insufficient_funds' }
      }
      return { ok: false, reason: 'unknown_error' }
    }
  }

  // ───────────────────────────────────────────────
  // DEBUG HELPERS (instant end of game)
  // ───────────────────────────────────────────────

  function prepareInstantEnd() {
    // não mexer se o match já acabou
    if (status.value === 'match_finished') return false

    status.value = 'in_game'

    if (!beganAt.value) {
      beganAt.value = new Date(Date.now() - 60_000).toISOString()
    }
    endedAt.value = new Date().toISOString()

    // limpar mesa / mãos / stock para o isGameOver ficar true
    playerHand.value = []
    botHand.value = []
    stock.value = []
    tableCards.value = { player: null, bot: null }

    return true
  }

  // Win com CAPOTE (>=91 e <120)
  function debugWinCapoteGame() {
    if (!prepareInstantEnd()) return

    playerPoints.value = 100 // qualquer valor entre 91 e 119
    botPoints.value = 20

    finishGameIfNeeded('player')
  }

  // Win com BANDEIRA (120-0)
  function debugWinBandeiraGame() {
    if (!prepareInstantEnd()) return

    playerPoints.value = 120
    botPoints.value = 0

    finishGameIfNeeded('player')
  }

  // Lose com BANDEIRA do bot (0-120)
  function debugLoseBandeiraGame() {
    if (!prepareInstantEnd()) return

    playerPoints.value = 0
    botPoints.value = 120

    finishGameIfNeeded('bot')
  }

  // Empate (draw)
  function debugDrawGame() {
    if (!prepareInstantEnd()) return

    playerPoints.value = 60
    botPoints.value = 60

    // o parâmetro winner aqui é irrelevante porque o isGameOver já é true
    finishGameIfNeeded('player')
  }

  // Mantemos os antigos para não partir nada, mas agora só “reencaminham”
  function debugForceEnd() {
    // por default: vitória bandeira
    debugWinBandeiraGame()
  }

  function debugForceEndPractice() {
    debugWinBandeiraGame()
  }

  function debugForceEndMatch() {
    debugWinBandeiraGame()
  }

  function debugForceLoss() {
    debugLoseBandeiraGame()
  }

  function debugForceLossPractice() {
    debugLoseBandeiraGame()
  }

  function debugForceLossMatch() {
    debugLoseBandeiraGame()
  }

  async function saveMatchGame(gameWinner) {
    if (gameType.value !== 'match') return
    if (!currentMatchId.value) return

    const p1 = authStore.currentUser?.id
    const p2 = 521

    const isDraw = playerPoints.value === botPoints.value
    const winnerUserId = isDraw ? null : gameWinner === 'player' ? p1 : p2
    const loserUserId = isDraw ? null : gameWinner === 'player' ? p2 : p1

    const payload = {
      type: variant.value,
      player1_user_id: p1,
      player2_user_id: p2,
      is_draw: isDraw,
      winner_user_id: winnerUserId,
      loser_user_id: loserUserId,
      match_id: currentMatchId.value,
      status: 'Ended',
      began_at: beganAt.value,
      ended_at: endedAt.value,
      player1_points: playerPoints.value,
      player2_points: botPoints.value,
    }

    await apiStore.postGame(payload)
  }

  // ───────────────────────────────────────────────

  return {
    // state
    gameType,
    variant,
    status,
    stock,
    trumpCard,
    playerHand,
    botHand,
    tableCards,
    collectedTricksPlayer,
    collectedTricksBot,
    playerPoints,
    botPoints,
    playerMarks,
    botMarks,
    currentGameNumber,
    currentTurn,
    phase,
    summary,
    beganAt,
    endedAt,
    currentMatchId,
    matchPlayer1Points,
    matchPlayer2Points,
    matchGames,
    lastTrickWinner,
    lastTrickCards,
    lastTrickToken,

    // computed
    isDrawPhase,
    isFinalPhase,
    isGameOver,
    isMatchFinished,

    // methods
    startMatch,
    resetMatch,
    startGame,
    playCard,
    botPlay,
    resolveTrick,
    drawCardsIfNeeded,
    finishGameIfNeeded,
    finishMatch,
    displayRank,
    tryStartMatchEntry,
    awardCoinsIfNeeded,
    saveMatchGame,
    afterTrickAnimation,

    // debug antigos
    debugForceEnd,
    debugForceEndPractice,
    debugForceEndMatch,
    debugForceLoss,
    debugForceLossPractice,
    debugForceLossMatch,

    // novos debug específicos de outcome
    debugWinCapoteGame,
    debugWinBandeiraGame,
    debugLoseBandeiraGame,
    debugDrawGame,
  }
})
