import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useBiscaStore = defineStore('bisca', () => {
  //
  // ───────────────────────────────────────────────
  // STATE
  // ───────────────────────────────────────────────
  //

  const mode = ref('practice') // 'competitive' | 'practice'
  const status = ref('idle') // 'idle' | 'in_game' | 'between_games' | 'match_finished'

  const deck = ref([]) // baralho completo
  const stock = ref([]) // cartas restantes
  const trumpCard = ref(null) // carta de trunfo (stock[ stock.length-1 ])
  const playerHand = ref([])
  const botHand = ref([])

  const tableCards = ref({ player: null, bot: null })

  const collectedTricksPlayer = ref([])
  const collectedTricksBot = ref([])

  const playerPoints = ref(0)
  const botPoints = ref(0)

  const playerMarks = ref(0)
  const botMarks = ref(0)

  const currentGameNumber = ref(1)
  const currentTurn = ref('player') // 'player' | 'bot'

  const phase = ref('draw_phase') // 'draw_phase' | 'final_phase'

  const summary = ref(null) // resumo final

  // quem começou a vaza atual
  const trickLeader = ref('player') // 'player' | 'bot'

  //
  // ───────────────────────────────────────────────
  // COMPUTED
  // ───────────────────────────────────────────────
  //

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

  //
  // ───────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────
  //

  function createDeck() {
    // Bisca 40-cartas: 4 naipes * 10 ranks
    const suits = ['♠', '♥', '♦', '♣']
    const ranks = [
      { rank: 1, points: 11 }, // Ás
      { rank: 7, points: 10 }, // Bisca / Manilha
      { rank: 13, points: 4 }, // Rei
      { rank: 11, points: 3 }, // Valete
      { rank: 12, points: 2 }, // Dama
      { rank: 3, points: 0 }, // 3
      { rank: 2, points: 0 }, // 2
      { rank: 4, points: 0 }, // 4
      { rank: 5, points: 0 }, // 5
      { rank: 6, points: 0 }, // 6
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
    // Bot deve começar a próxima vaza: mesa vazia, jogo em curso
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

  //
  // ───────────────────────────────────────────────
  // MATCH FLOW
  // ───────────────────────────────────────────────
  //

  function startMatch({ mode: m }) {
    resetMatch()
    mode.value = m
    status.value = 'in_game'
    currentGameNumber.value = 1
    playerMarks.value = 0
    botMarks.value = 0
    startGame()
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
    tableCards.value = { player: null, bot: null }
    currentTurn.value = 'player'
    phase.value = 'draw_phase'
    trickLeader.value = 'player'
  }

  //
  // ───────────────────────────────────────────────
  // GAME FLOW
  // ───────────────────────────────────────────────
  //

  function startGame() {
    // se estivermos entre jogos, este é o próximo game
    if (status.value === 'between_games') {
      currentGameNumber.value++
    }

    status.value = 'in_game'
    phase.value = 'draw_phase'
    playerPoints.value = 0
    botPoints.value = 0
    collectedTricksPlayer.value = []
    collectedTricksBot.value = []
    tableCards.value = { player: null, bot: null }
    trickLeader.value = 'player'

    // construir deck novo
    deck.value = createDeck()
    shuffle(deck.value)

    // Bisca de 3: 3 cartas para cada
    playerHand.value = deck.value.splice(0, 3)
    botHand.value = deck.value.splice(0, 3)

    // trunfo = última carta do stock
    trumpCard.value = deck.value[deck.value.length - 1]

    // stock inicial = resto
    stock.value = deck.value
    deck.value = []

    // jogador começa o primeiro game
    currentTurn.value = 'player'
  }

  //
  // ───────────────────────────────────────────────
  // PLAY FLOW
  // ───────────────────────────────────────────────
  //

  function playCard(card) {
    if (status.value !== 'in_game') return
    if (currentTurn.value !== 'player') return
    if (!playerHand.value.some((c) => c.id === card.id)) return
    if (tableCards.value.player) return // já jogou nesta vaza

    // se a mesa está vazia, o player está a abrir a vaza
    if (!tableCards.value.player && !tableCards.value.bot) {
      trickLeader.value = 'player'
    }

    // Fase final: se o bot já começou a vaza, o player tem de seguir o naipe se puder
    if (isFinalPhase.value && tableCards.value.bot) {
      const leadingSuit = tableCards.value.bot.suit
      const hasSuit = playerHand.value.some((c) => c.suit === leadingSuit)
      if (hasSuit && card.suit !== leadingSuit) {
        console.warn('Jogador tem de seguir o naipe.')
        return
      }
    }

    // jogar carta do player
    playerHand.value = playerHand.value.filter((c) => c.id !== card.id)
    tableCards.value.player = card

    // passa a vez para o bot
    currentTurn.value = 'bot'

    // se o bot já tinha carta na mesa, resolve depois de 1 segundo
    if (tableCards.value.bot) {
      setTimeout(() => {
        resolveTrick()
      }, 1000)
    } else {
      // bot ainda não jogou, dar 1s para animar
      setTimeout(() => {
        botPlay()
      }, 1000)
    }
  }

  function sortByPointsAsc(cards) {
    return [...cards].sort((a, b) => a.points - b.points)
  }

  function chooseLowest(cards) {
    if (!cards.length) return null
    return sortByPointsAsc(cards)[0]
  }

  function cardBeats(c1, c2, leadingSuit, trumpSuit) {
    // trunfo ganha sempre
    if (c1.suit === trumpSuit && c2.suit !== trumpSuit) return true
    if (c2.suit === trumpSuit && c1.suit !== trumpSuit) return false

    // mesmo naipe → maior "força" (usamos points como proxy)
    if (c1.suit === c2.suit) {
      return c1.points > c2.points
    }

    // quem respeita o naipe principal ganha
    if (c1.suit === leadingSuit && c2.suit !== leadingSuit) return true
    return false
  }

  //
  // BOT AI
  // ───────────────────────────────────────────────
  //

  function botPlay() {
    if (status.value !== 'in_game') return
    if (currentTurn.value !== 'bot') return

    const hand = botHand.value
    if (hand.length === 0) return

    const trumpSuit = trumpCard.value?.suit
    let cardToPlay = null

    //
    // CASO 1: bot começa a vaza (mesa vazia)
    // → joga sempre a carta mais baixa
    //
    if (!tableCards.value.player && !tableCards.value.bot) {
      cardToPlay = chooseLowest(hand)

      botHand.value = botHand.value.filter((c) => c.id !== cardToPlay.id)
      tableCards.value.bot = cardToPlay
      trickLeader.value = 'bot'
      currentTurn.value = 'player'
      return
    }

    //
    // CASO 2: bot está a responder (tu começaste ou respondeste à carta dele)
    //
    const opponentCard = tableCards.value.player || tableCards.value.bot
    const leadingSuit = tableCards.value.player
      ? tableCards.value.player.suit
      : tableCards.value.bot.suit

    const sameSuitCards = hand.filter((c) => c.suit === leadingSuit)
    const trumpCards = hand.filter((c) => c.suit === trumpSuit)
    const otherCards = hand.filter((c) => c.suit !== leadingSuit && c.suit !== trumpSuit)

    //
    // Fase final: se tiver naipe, é obrigado a seguir
    //
    if (isFinalPhase.value && sameSuitCards.length > 0) {
      const winners = sameSuitCards.filter((c) =>
        cardBeats(c, opponentCard, leadingSuit, trumpSuit),
      )

      if (winners.length > 0) {
        // tem mais alto do mesmo naipe → joga a mais fraca que ainda ganhe
        cardToPlay = chooseLowest(winners)
      } else {
        // não consegue ganhar, mas é obrigado a seguir → joga a mais fraca do naipe
        cardToPlay = chooseLowest(sameSuitCards)
      }
    } else {
      //
      // Draw phase OU não tem o naipe → aplica a regra simples que disseste:
      // "se tiver mais alto manda, senão corta, senão manda lixo"
      //

      if (sameSuitCards.length > 0) {
        // tem o mesmo naipe que tu jogaste
        const winners = sameSuitCards.filter((c) =>
          cardBeats(c, opponentCard, leadingSuit, trumpSuit),
        )

        if (winners.length > 0) {
          // tem carta mais alta do mesmo naipe → manda (a mais baixa que ainda ganhe)
          cardToPlay = chooseLowest(winners)
        } else if (trumpCards.length > 0) {
          // não consegue ganhar pelo naipe, mas pode cortar
          cardToPlay = chooseLowest(trumpCards)
        } else {
          // não tem como ganhar → manda lixo (carta mais baixa que tiver)
          const trash = [...sameSuitCards, ...otherCards, ...trumpCards]
          cardToPlay = chooseLowest(trash)
        }
      } else {
        // não tem o naipe que foi liderado
        if (trumpCards.length > 0) {
          // pode cortar → corta
          cardToPlay = chooseLowest(trumpCards)
        } else {
          // não tem trunfo → manda lixo (qualquer carta baixa)
          const trash = [...otherCards]
          cardToPlay = chooseLowest(trash)
        }
      }
    }

    // fallback só para não rebentar
    if (!cardToPlay) {
      cardToPlay = hand[0]
    }

    botHand.value = botHand.value.filter((c) => c.id !== cardToPlay.id)
    tableCards.value.bot = cardToPlay

    // agora temos as duas cartas na mesa → resolver vaza depois de 1s
    setTimeout(() => {
      resolveTrick()
    }, 1000)
  }

  //
  // ───────────────────────────────────────────────
  // RESOLVE TRICK
  // ───────────────────────────────────────────────
  //

  function resolveTrick() {
    const p = tableCards.value.player
    const b = tableCards.value.bot

    if (!p || !b) return

    let winner = null

    // suit principal = primeira carta jogada (player ou bot)
    const leadingSuit = trickLeader.value === 'player' ? p.suit : b.suit

    function beats(c1, c2) {
      // trunfo ganha sempre
      if (c1.suit === trumpCard.value.suit && c2.suit !== trumpCard.value.suit) return true
      if (c2.suit === trumpCard.value.suit && c1.suit !== trumpCard.value.suit) return false

      // mesmo naipe → maior "força" (usamos points como proxy de ranking)
      if (c1.suit === c2.suit) {
        return c1.points >= c2.points
      }

      // quem respeita o naipe principal ganha
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

    // limpar mesa
    tableCards.value = { player: null, bot: null }

    drawCardsIfNeeded(winner)
  }

  //
  // ───────────────────────────────────────────────
  // DRAW CARDS
  // ───────────────────────────────────────────────
  //

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

  //
  // ───────────────────────────────────────────────
  // GAME AND MATCH END
  // ───────────────────────────────────────────────
  //

  function finishGameIfNeeded(winner) {
    if (!isGameOver.value) {
      currentTurn.value = winner
      trickLeader.value = winner
      // se o próximo a jogar for o bot e a mesa estiver vazia,
      // ele deve começar a vaza automaticamente
      scheduleBotStartIfNeeded()
      return
    }

    // ───────────────────────────────────────────────
    // ATRIBUIR MARKS SEGUNDO O ENUNCIADO
    // ───────────────────────────────────────────────

    let gameWinner = null
    let gameWinnerPoints = 0

    if (playerPoints.value > botPoints.value) {
      gameWinner = 'player'
      gameWinnerPoints = playerPoints.value
    } else if (botPoints.value > playerPoints.value) {
      gameWinner = 'bot'
      gameWinnerPoints = botPoints.value
    } else {
      // empate -> zero marks para ambos
      gameWinner = null
    }

    if (gameWinner) {
      if (gameWinnerPoints === 120) {
        // BANDEIRA → match ganho diretamente
        if (gameWinner === 'player') {
          playerMarks.value = 4
        } else {
          botMarks.value = 4
        }
      } else if (gameWinnerPoints >= 91) {
        // CAPOTE → 2 marks
        if (gameWinner === 'player') {
          playerMarks.value += 2
        } else {
          botMarks.value += 2
        }
      } else if (gameWinnerPoints >= 61) {
        // vitória normal → 1 mark
        if (gameWinner === 'player') {
          playerMarks.value += 1
        } else {
          botMarks.value += 1
        }
      }
      // se <61 ambos → zero marks, não mexemos
    }

    // ───────────────────────────────────────────────
    // FIM DE MATCH OU CONTINUAR
    // ───────────────────────────────────────────────

    if (isMatchFinished.value) {
      finishMatch()
    } else {
      status.value = 'between_games'
    }
  }

  function finishMatch() {
    status.value = 'match_finished'
    summary.value = {
      result: playerMarks.value > botMarks.value ? 'win' : 'loss',
      playerMarks: playerMarks.value,
      botMarks: botMarks.value,
      playerPoints: playerPoints.value,
      botPoints: botPoints.value,
      achievements: {
        capote: playerMarks.value === 4 && botMarks.value === 0,
        // TODO: ajustar regra real de bandeira se quiserem
        bandeira: playerPoints.value > botPoints.value + 30,
      },
      mode: mode.value,
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

  //
  // EXPORTAR
  // ───────────────────────────────────────────────
  //

  return {
    // state
    mode,
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
  }
})
