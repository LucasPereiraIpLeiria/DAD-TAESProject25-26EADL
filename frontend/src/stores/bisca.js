import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useBiscaStore = defineStore('bisca', () => {

    //
    // ───────────────────────────────────────────────
    // STATE
    // ───────────────────────────────────────────────
    //

    const mode = ref('practice') // 'competitive' | 'practice'
    const status = ref('idle')   // 'idle' | 'in_game' | 'between_games' | 'match_finished'

    const deck = ref([])          // baralho completo
    const stock = ref([])         // cartas restantes
    const trumpCard = ref(null)   // carta de trunfo (stock[ stock.length-1 ])
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


    //
    // ───────────────────────────────────────────────
    // COMPUTED
    // ───────────────────────────────────────────────
    //

    const isDrawPhase = computed(() => phase.value === 'draw_phase')
    const isFinalPhase = computed(() => phase.value === 'final_phase')

    const isGameOver = computed(() => {
        return playerHand.value.length === 0 &&
               botHand.value.length === 0 &&
               stock.value.length === 0 &&
               tableCards.value.player === null &&
               tableCards.value.bot === null
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
            { rank: 1, points: 11 },
            { rank: 3, points: 10 },
            { rank: 13, points: 4 },
            { rank: 12, points: 3 },
            { rank: 11, points: 2 },
            { rank: 7, points: 0 },
            { rank: 6, points: 0 },
            { rank: 5, points: 0 },
            { rank: 4, points: 0 },
            { rank: 2, points: 0 },
        ]

        let d = []
        let id = 1

        for (const suit of suits) {
            for (const r of ranks) {
                d.push({
                    id: id++,
                    suit,
                    rank: r.rank,
                    points: r.points
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
    }


    //
    // ───────────────────────────────────────────────
    // GAME FLOW
    // ───────────────────────────────────────────────
    //

    function startGame() {
        status.value = 'in_game'
        phase.value = 'draw_phase'
        playerPoints.value = 0
        botPoints.value = 0
        collectedTricksPlayer.value = []
        collectedTricksBot.value = []
        tableCards.value = { player: null, bot: null }

        // construir deck
        deck.value = createDeck()
        shuffle(deck.value)

        // dar cartas iniciais
        playerHand.value = deck.value.splice(0, 3)
        botHand.value = deck.value.splice(0, 3)

        // trunfo = última carta do stock
        trumpCard.value = deck.value[deck.value.length - 1]

        // stock inicial = resto
        stock.value = deck.value
        deck.value = []

        // jogador começa sempre por agora
        currentTurn.value = 'player'
    }


    //
    // ───────────────────────────────────────────────
    // PLAY FLOW
    // ───────────────────────────────────────────────
    //

    function playCard(card) {
        if (currentTurn.value !== 'player') return
        if (!playerHand.value.includes(card)) return

        // regra follow suit (só no final phase)
        if (isFinalPhase.value && tableCards.value.player !== null) {
            // já foi jogada carta pelo bot → validar resposta do player
            const leadingSuit = tableCards.value.bot.suit
            const hasSuit = playerHand.value.some(c => c.suit === leadingSuit)
            if (hasSuit && card.suit !== leadingSuit) {
                console.warn("Jogador tem de seguir o naipe.")
                return
            }
        }

        // jogar
        playerHand.value = playerHand.value.filter(c => c.id !== card.id)
        tableCards.value.player = card

        currentTurn.value = 'bot'
        botPlay()
    }


    function botPlay() {
        const hand = botHand.value

        if (hand.length === 0) return

        // estratégia básica (melhorar depois)
        let cardToPlay = null

        if (tableCards.value.player === null) {
            // bot começa a vaza
            cardToPlay = hand[0]
        } else {
            // bot responde → follow suit se existir
            const leadingSuit = tableCards.value.player.suit
            const valid = hand.filter(c => c.suit === leadingSuit)

            if (valid.length > 0)
                cardToPlay = valid[0]
            else
                cardToPlay = hand[0]
        }

        botHand.value = botHand.value.filter(c => c.id !== cardToPlay.id)
        tableCards.value.bot = cardToPlay

        resolveTrick()
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

        // suit principal
        const leadingSuit = p.suit

        function beats(c1, c2) {
            // trunfo ganha sempre
            if (c1.suit === trumpCard.value.suit && c2.suit !== trumpCard.value.suit) return true
            if (c2.suit === trumpCard.value.suit && c1.suit !== trumpCard.value.suit) return false

            // mesmo naipe → rank maior ganha
            if (c1.suit === c2.suit) 
                return c1.points >= c2.points

            // quem não responde perde
            if (c1.suit === leadingSuit) return true
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
                playerHand.value.push(stock.value.shift())
                botHand.value.push(stock.value.shift())
            } else {
                botHand.value.push(stock.value.shift())
                playerHand.value.push(stock.value.shift())
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
            return
        }

        // atribuir marks
        if (playerPoints.value > botPoints.value)
            playerMarks.value++
        else if (botPoints.value > playerPoints.value)
            botMarks.value++

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
                capote: (playerMarks.value === 4 && botMarks.value === 0),
                bandeira: (playerPoints.value > botPoints.value + 30) // placeholder
            },
            mode: mode.value,
        }
    }


    //
    // EXPORTAR
    // ───────────────────────────────────────────────
    //

    return {
        // state
        mode, status,
        stock, trumpCard,
        playerHand, botHand,
        tableCards,
        collectedTricksPlayer, collectedTricksBot,
        playerPoints, botPoints,
        playerMarks, botMarks,
        currentGameNumber,
        currentTurn,
        phase,
        summary,

        // computed
        isDrawPhase, isFinalPhase,
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
    }
})
