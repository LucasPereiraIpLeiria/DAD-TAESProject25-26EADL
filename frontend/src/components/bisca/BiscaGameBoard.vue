<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BiscaPlayerHand from '@/components/bisca/BiscaPlayerHand.vue'

const props = defineProps({
  bisca: {
    type: Object,
    required: true,
  },
  isPlayerTurn: {
    type: Boolean,
    required: true,
  },
  mustFollowSuit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['play-card'])

function onPlayCard(card) {
  emit('play-card', card)
}

// ---------- IMAGENS DAS CARTAS ----------

const cardImages = import.meta.glob('/src/assets/images/cards/*.png', {
  eager: true,
  import: 'default',
})

// Backs dos decks (default/wood/etc.)
const deckImages = import.meta.glob('/src/assets/images/decks/*.png', {
  eager: true,
  import: 'default',
})

// fallback caso falte algum ficheiro
const defaultBack = deckImages['/src/assets/images/decks/default.png'] || ''

const auth = useAuthStore()

const selectedDeckKey = computed(() => {
  // se não estiver logado ou o custom vier undefined, fica 'default'
  return auth.currentUser?.custom?.decks?.selected ?? 'default'
})

const deckBackImageUrl = computed(() => {
  const key = `/src/assets/images/decks/${selectedDeckKey.value}.png`
  return deckImages[key] || defaultBack
})

function suitToLetter(suit) {
  switch (suit) {
    case '♥': return 'c' // copas
    case '♦': return 'o' // ouros
    case '♠': return 'e' // espadas
    case '♣': return 'p' // paus
    default: return ''
  }
}

/**
 * Converte a carta do store (suit + rank) para o ficheiro certo.
 * Ex: ♥ + 1 → c1.png,  ♠ + 13 → e13.png
 */
function getCardImageUrl(card) {
  if (!card) return ''

  const letter = suitToLetter(card.suit)
  if (!letter) return deckBackImageUrl.value

  const key = `/src/assets/images/cards/${letter}${card.rank}.png`
  const img = cardImages[key]

  // fallback para costas (do deck selecionado ou default)
  return img || deckBackImageUrl.value || ''
}

// ---------- ANIMAÇÃO DO BOT ----------

const botFloatingCard = ref(null) // { imgUrl, style }
const showBotCard = ref(true)
const playerDrawFloating = ref(null) // { imgUrl, style }
const botDrawFloating = ref(null)
const lastBotCardId = ref(null)
/**
 * Sempre que o bot mete uma carta na mesa (tableCards.bot deixa de ser null),
 * animamos uma carta a sair da zona da mão do bot até ao slot do bot.
 */
watch(
  () => props.bisca.tableCards.bot,
  async (newCard) => {
    // Quando limpa a mesa (ou no início)
    if (!newCard) {
      showBotCard.value = true
      botFloatingCard.value = null
      lastBotCardId.value = null
      return
    }

    // Se for a mesma carta que já animámos, não fazer nada
    if (newCard.id === lastBotCardId.value) {
      return
    }

    lastBotCardId.value = newCard.id

    // 👇 Garante que o DOM já foi atualizado com a nova carta na mesa
    await nextTick()

    const handEl = document.querySelector('.opponent-hand')
    const targetEl = document.querySelector('#table-bot-slot')

    if (!handEl || !targetEl) {
      return
    }

    const handRect = handEl.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()
    const imgUrl = getCardImageUrl(newCard)

    showBotCard.value = false

    botFloatingCard.value = {
      imgUrl,
      style: {
        position: 'fixed',
        top: `${handRect.top}px`,
        left: `${handRect.left + handRect.width / 2 - 40}px`,
        width: `80px`,
        height: `120px`,
        transition: `top 0.25s ease-out, left 0.25s ease-out`,
        zIndex: 9998,
        pointerEvents: 'none',
      },
    }

    // Espera a carta flutuante entrar no DOM
    await nextTick()

    requestAnimationFrame(() => {
      if (!botFloatingCard.value) return
      botFloatingCard.value.style.top = `${targetRect.top}px`
      botFloatingCard.value.style.left = `${targetRect.left}px`
    })

    setTimeout(() => {
      showBotCard.value = true
      botFloatingCard.value = null
    }, 260)
  },
  {
    flush: 'post', // 👈 corre depois do render, alinhado com o watcher do draw
  },
)


watch(
  () => ({
    stock: props.bisca.stock.length,
    player: props.bisca.playerHand.length,
    bot: props.bisca.botHand.length,
  }),
  async (newVals, oldVals) => {
    if (!oldVals) return

    const stockDiff = oldVals.stock - newVals.stock

    // Só interessa quando o stock diminui
    if (stockDiff <= 0) return

    const deckEl = document.querySelector('.deck-stack')
    if (!deckEl) return

    const deckRect = deckEl.getBoundingClientRect()
    const cardWidth = 80
    const cardHeight = 120

    const playerDiff = newVals.player - oldVals.player
    const botDiff = newVals.bot - oldVals.bot

    // ---------- DRAW PARA O PLAYER ----------
    if (playerDiff > 0) {
      const handEl = document.querySelector('.player-hand-row')
      if (handEl) {
        const handRect = handEl.getBoundingClientRect()

        const targetTop = handRect.top + handRect.height / 2 - cardHeight / 2
        const targetLeft = handRect.right - cardWidth - 8

        playerDrawFloating.value = {
          imgUrl: deckBackImageUrl.value,
          style: {
            position: 'fixed',
            top: `${deckRect.top}px`,
            left: `${deckRect.left}px`,
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            transition: 'top 0.25s ease-out, left 0.25s ease-out',
            zIndex: 9997,
            pointerEvents: 'none',
          },
        }

        await nextTick()

        requestAnimationFrame(() => {
          if (!playerDrawFloating.value) return
          playerDrawFloating.value.style.top = `${targetTop}px`
          playerDrawFloating.value.style.left = `${targetLeft}px`
        })

        setTimeout(() => {
          playerDrawFloating.value = null
        }, 260)
      }
    }

    // ---------- DRAW PARA O BOT ----------
    if (botDiff > 0) {
      const oppEl = document.querySelector('.opponent-hand')
      if (oppEl) {
        const oppRect = oppEl.getBoundingClientRect()

        const targetTop = oppRect.top + oppRect.height / 2 - cardHeight / 2
        const targetLeft = oppRect.right - cardWidth - 8

        botDrawFloating.value = {
          imgUrl: deckBackImageUrl.value,
          style: {
            position: 'fixed',
            top: `${deckRect.top}px`,
            left: `${deckRect.left}px`,
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            transition: `top 0.25s ease-out, left 0.25s ease-out`,
            zIndex: 9997,
            pointerEvents: 'none',
          },
        }

        await nextTick()

        requestAnimationFrame(() => {
          if (!botDrawFloating.value) return
          botDrawFloating.value.style.top = `${targetTop}px`
          botDrawFloating.value.style.left = `${targetLeft}px`
        })

        setTimeout(() => {
          botDrawFloating.value = null
        }, 260)
      }
    }
  },
  {
    flush: 'post', // 👈 chave para não “bater” com o watcher do bot
  },
)


</script>

<template>
  <section class="board">
    <!-- MÃO DO BOT POR CIMA DO GAMEBOARD -->
    <div class="opponent-hand">
      <template v-if="bisca.botHand && bisca.botHand.length > 0">
        <div v-for="card in bisca.botHand" :key="card.id" class="opponent-card">
          <img :src="deckBackImageUrl" alt="Carta do bot" class="opponent-card-image">
        </div>
      </template>

      <!-- placeholder invisível só para manter altura, quando não há cartas -->
      <div v-else class="opponent-placeholder" />
    </div>

    <div class="board-layout">
      <!-- CARTAS JOGADAS AO CENTRO -->
      <div class="center-cards">
        <!-- Bot -->
        <div class="table-slot" id="table-bot-slot">
          <img v-if="bisca.tableCards.bot && showBotCard" :src="getCardImageUrl(bisca.tableCards.bot)"
            :alt="`Carta do bot ${bisca.tableCards.bot.suit} ${bisca.displayRank(bisca.tableCards.bot.rank)}`"
            class="table-card-image table-card-image--bot">
          <span v-else class="table-card table-card--empty">

          </span>
        </div>

        <!-- Tu -->
        <div id="table-player-slot" class="table-slot">
          <img v-if="bisca.tableCards.player" :src="getCardImageUrl(bisca.tableCards.player)"
            :alt="`Tua carta ${bisca.tableCards.player.suit} ${bisca.displayRank(bisca.tableCards.player.rank)}`"
            class="table-card-image table-card-image--you">
          <span v-else class="table-card table-card--empty">

          </span>
        </div>
      </div>

      <!-- DECK + TRUNFO à direita -->
      <div class="side-info">
        <div class="deck-stack">
          <!-- Trunfo por baixo, deitado -->
          <img v-if="bisca.trumpCard" v-show="bisca.stock.length > 0" :src="getCardImageUrl(bisca.trumpCard)"
            alt="Carta de trunfo" class="trump-image trump-image-bold">

          <!-- Deck cover por cima -->
          <img v-if="deckBackImageUrl" v-show="bisca.stock.length > 0" :src="deckBackImageUrl" alt="Monte de cartas"
            class="deck-image">
        </div>
      </div>
    </div>

    <!-- MÃO DO PLAYER POR BAIXO DO GAMEBOARD, MAS AINDA DENTRO DO MESMO COMPONENTE -->
    <BiscaPlayerHand :bisca="bisca" :is-player-turn="isPlayerTurn" :must-follow-suit="mustFollowSuit"
      @play-card="onPlayCard" />
    <!-- Carta flutuante do BOT -->
    <div v-if="botFloatingCard" class="bot-floating-card" :style="botFloatingCard.style">
      <img :src="botFloatingCard.imgUrl" alt="Carta jogada pelo bot" class="bot-floating-card-image table-card-image--bot">
    </div>
    <!-- Carta flutuante de DRAW para o PLAYER -->
    <div v-if="playerDrawFloating" class="draw-floating-card" :style="playerDrawFloating.style">
      <img :src="playerDrawFloating.imgUrl" alt="Carta vinda do baralho para a tua mão"
        class="draw-floating-card-image">
    </div>

    <!-- Carta flutuante de DRAW para o BOT -->
    <div v-if="botDrawFloating" class="draw-floating-card" :style="botDrawFloating.style">
      <img :src="botDrawFloating.imgUrl" alt="Carta vinda do baralho para a mão do bot"
        class="draw-floating-card-image">
    </div>
  </section>

</template>


<style scoped>
.board {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  padding: 1rem;
  margin-bottom: 1.25rem;
}

/* MÃO DO BOT EM CIMA */
.opponent-hand {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;

  min-height: 120px;
}

.opponent-card {
  flex: 0 0 auto;
}

.opponent-card-image {
  width: 80px;
  height: 120px;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.35);
  object-fit: contain;
}

.opponent-placeholder {
  width: 80px;
  height: 120px;
}

/* layout principal */
.board-layout {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
}

/* centro */
.center-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  justify-self: center;
  transform: translateX(35px);
}

.table-slot {
  min-height: 120px;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Tamanho único para cartas em jogo + deck + trunfo */
.table-card-image,
.deck-image,
.trump-image {
  width: 80px;
  height: 120px;
  border-radius: 8px;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.25);
  object-fit: contain;
}

.table-card-image--you,
.table-card-image--bot,
.trump-image-bold {
  outline: 2px solid #111827;
}

.table-card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
  padding: 0.4rem 0.75rem;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
}

.table-card--empty {
  color: #9ca3af;
  font-weight: 400;
}

/* lado direito */
.side-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-self: end;
}

.deck-stack {
  position: relative;
  width: 140px;
  /* um pouco mais largo para caber o T */
  height: 120px;
}

/* Trunfo: continua no centro, deitado */
.trump-image {
  position: absolute;
  top: 50%;
  left: 40%;
  /* ligeiramente mais à esquerda */
  transform: translate(-50%, -50%) rotate(90deg);
  transform-origin: center center;
  z-index: 1;
}

/* Deck: mais à direita, vertical, fazendo o T deitado */
.deck-image {
  position: absolute;
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.bot-floating-card-image,
.draw-floating-card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.35);
}
</style>
