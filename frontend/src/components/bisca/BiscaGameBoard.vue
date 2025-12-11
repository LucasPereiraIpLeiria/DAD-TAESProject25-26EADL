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

// ---------- CARD IMAGES ----------

const cardImages = import.meta.glob('/src/assets/images/cards/*.png', {
  eager: true,
  import: 'default',
})

// Deck backs (default/wood/etc.)
const deckImages = import.meta.glob('/src/assets/images/decks/*.png', {
  eager: true,
  import: 'default',
})

// fallback if some file is missing
const defaultBack = deckImages['/src/assets/images/decks/default.png'] || ''

const auth = useAuthStore()

const selectedDeckKey = computed(() => {
  // if not logged in or custom undefined, fall back to 'default'
  return auth.currentUser?.custom?.decks?.selected ?? 'default'
})

const deckBackImageUrl = computed(() => {
  const key = `/src/assets/images/decks/${selectedDeckKey.value}.png`
  return deckImages[key] || defaultBack
})

function suitToLetter(suit) {
  switch (suit) {
    case '♥': return 'c'
    case '♦': return 'o'
    case '♠': return 'e'
    case '♣': return 'p'
    default: return ''
  }
}

/**
 * Maps a store card (suit + rank) to the right file.
 * Ex: ♥ + 1 → c1.png,  ♠ + 13 → e13.png
 */
function getCardImageUrl(card) {
  if (!card) return ''

  const letter = suitToLetter(card.suit)
  if (!letter) return deckBackImageUrl.value

  const key = `/src/assets/images/cards/${letter}${card.rank}.png`
  const img = cardImages[key]

  // fallback to deck back (selected or default)
  return img || deckBackImageUrl.value || ''
}

// ---------- BOT ANIMATION ----------

const botFloatingCard = ref(null) // { imgUrl, style }
const showBotCard = ref(true)
const playerDrawFloating = ref(null) // { imgUrl, style }
const botDrawFloating = ref(null)
const lastBotCardId = ref(null)
const trickFloatingCards = ref([]) // [{ key, imgUrl, style }]
const hideTrickCards = ref(false)

/**
 * Whenever the bot plays a card (tableCards.bot becomes non-null),
 * animate a card coming from the bot’s hand area to the bot slot.
 */
watch(
  () => props.bisca.tableCards.bot,
  async (newCard) => {
    // When clearing the table (or at start)
    if (!newCard) {
      showBotCard.value = true
      botFloatingCard.value = null
      lastBotCardId.value = null
      return
    }

    // Skip if it’s the same card we already animated
    if (newCard.id === lastBotCardId.value) {
      return
    }

    lastBotCardId.value = newCard.id

    // Ensure DOM has updated with the new table card
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

    // Wait for the floating card to be in the DOM
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
    flush: 'post',
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

    // Only care when stock decreases
    if (stockDiff <= 0) return

    const deckEl = document.querySelector('.deck-stack')
    if (!deckEl) return

    const deckRect = deckEl.getBoundingClientRect()
    const cardWidth = 80
    const cardHeight = 120

    const playerDiff = newVals.player - oldVals.player
    const botDiff = newVals.bot - oldVals.bot

    // ---------- DRAW FOR PLAYER ----------
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
            transition: 'top 0.6s ease-out, left 0.25s ease-out',
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
        }, 700)
      }
    }

    // ---------- DRAW FOR BOT ----------
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
            transition: `top 0.6s ease-out, left 0.25s ease-out`,
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
        }, 700)
      }
    }
  },
  {
    flush: 'post',
  },
)

watch(
  () => props.bisca.lastTrickToken,
  async (token) => {
    // First trick will have token = 1, so it won’t hit this early return
    if (!token) return

    const winner = props.bisca.lastTrickWinner
    const cards = props.bisca.lastTrickCards

    if (!winner) return
    if (!cards?.player || !cards?.bot) return

    // Ensure DOM is ready
    await nextTick()

    // Keep cards in the center for a bit
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const playerSlotEl = document.querySelector('#table-player-slot')
    const botSlotEl = document.querySelector('#table-bot-slot')
    const botTrickSlotEl = document.querySelector('#bot-trick-slot')
    const playerTrickSlotEl = document.querySelector('#player-trick-slot')

    if (!playerSlotEl || !botSlotEl || !botTrickSlotEl || !playerTrickSlotEl) {
      props.bisca.afterTrickAnimation()
      return
    }

    const playerSlotRect = playerSlotEl.getBoundingClientRect()
    const botSlotRect = botSlotEl.getBoundingClientRect()
    const botTrickRect = botTrickSlotEl.getBoundingClientRect()
    const playerTrickRect = playerTrickSlotEl.getBoundingClientRect()

    const destRect = winner === 'player' ? playerTrickRect : botTrickRect

    const cardWidth = 80
    const cardHeight = 120

    hideTrickCards.value = true

    trickFloatingCards.value = [
      {
        key: `trick-player-${cards.player.id}-${token}`,
        imgUrl: getCardImageUrl(cards.player),
        style: {
          position: 'fixed',
          top: `${playerSlotRect.top}px`,
          left: `${playerSlotRect.left}px`,
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          transition: 'top 0.6s ease-out, left 0.3s ease-out',
          zIndex: 9996,
          pointerEvents: 'none',
        },
      },
      {
        key: `trick-bot-${cards.bot.id}-${token}`,
        imgUrl: getCardImageUrl(cards.bot),
        style: {
          position: 'fixed',
          top: `${botSlotRect.top}px`,
          left: `${botSlotRect.left}px`,
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          transition: 'top 0.6s ease-out, left 0.3s ease-out',
          zIndex: 9996,
          pointerEvents: 'none',
        },
      },
    ]

    await nextTick()

    requestAnimationFrame(() => {
      for (const fc of trickFloatingCards.value) {
        fc.style.top = `${destRect.top}px`
        fc.style.left = `${destRect.left}px`
      }
    })

    setTimeout(() => {
      trickFloatingCards.value = []
      hideTrickCards.value = false
      props.bisca.afterTrickAnimation()
    }, 700)
  },
  { flush: 'post' },
)
</script>

<template>
  <section class="board">
    <!-- Fixed trick slots where trick cards “fly” to -->
    <div id="bot-trick-slot" class="trick-slot trick-slot--bot" />
    <div id="player-trick-slot" class="trick-slot trick-slot--player" />

    <!-- OPPONENT HAND ABOVE BOARD -->
    <div class="opponent-hand">
      <template v-if="bisca.botHand && bisca.botHand.length > 0">
        <div
          v-for="card in bisca.botHand"
          :key="card.id"
          class="opponent-card"
        >
          <img
            :src="deckBackImageUrl"
            alt="Bot card"
            class="opponent-card-image"
          >
        </div>
      </template>

      <!-- Invisible placeholder to keep height when there are no cards -->
      <div v-else class="opponent-placeholder" />
    </div>

    <div class="board-layout">
      <!-- CENTER TABLE CARDS -->
      <div class="center-cards">
        <!-- Bot -->
        <div class="table-slot" id="table-bot-slot">
          <img
            v-if="bisca.tableCards.bot && showBotCard && !hideTrickCards"
            :src="getCardImageUrl(bisca.tableCards.bot)"
            :alt="`Bot card ${bisca.tableCards.bot.suit} ${bisca.displayRank(bisca.tableCards.bot.rank)}`"
            class="table-card-image table-card-image--bot"
          >
          <span
            v-else
            class="table-card table-card--empty"
          />
        </div>

        <!-- You -->
        <div id="table-player-slot" class="table-slot">
          <img
            v-if="bisca.tableCards.player && !hideTrickCards"
            :src="getCardImageUrl(bisca.tableCards.player)"
            :alt="`Your card ${bisca.tableCards.player.suit} ${bisca.displayRank(bisca.tableCards.player.rank)}`"
            class="table-card-image table-card-image--you"
          >
          <span
            v-else
            class="table-card table-card--empty"
          />
        </div>
      </div>

      <!-- DECK + TRUMP ON THE RIGHT -->
      <div class="side-info">
        <div class="deck-stack">
          <!-- Trump card underneath, rotated -->
          <img
            v-if="bisca.trumpCard"
            v-show="bisca.stock.length > 0"
            :src="getCardImageUrl(bisca.trumpCard)"
            alt="Trump card"
            class="trump-image trump-image-bold"
          >

          <!-- Deck cover on top -->
          <img
            v-if="deckBackImageUrl"
            v-show="bisca.stock.length > 0"
            :src="deckBackImageUrl"
            alt="Card stack"
            class="deck-image"
          >
        </div>
      </div>
    </div>

    <!-- PLAYER HAND BELOW BOARD, BUT STILL INSIDE SAME COMPONENT -->
    <BiscaPlayerHand
      :bisca="bisca"
      :is-player-turn="isPlayerTurn"
      :must-follow-suit="mustFollowSuit"
      @play-card="onPlayCard"
    />

    <!-- Bot floating card -->
    <div
      v-if="botFloatingCard"
      class="bot-floating-card"
      :style="botFloatingCard.style"
    >
      <img
        :src="botFloatingCard.imgUrl"
        alt="Card played by the bot"
        class="bot-floating-card-image table-card-image--bot"
      >
    </div>

    <!-- Draw floating card for PLAYER -->
    <div
      v-if="playerDrawFloating"
      class="draw-floating-card"
      :style="playerDrawFloating.style"
    >
      <img
        :src="playerDrawFloating.imgUrl"
        alt="Card drawn from deck to your hand"
        class="draw-floating-card-image"
      >
    </div>

    <!-- Draw floating card for BOT -->
    <div
      v-if="botDrawFloating"
      class="draw-floating-card"
      :style="botDrawFloating.style"
    >
      <img
        :src="botDrawFloating.imgUrl"
        alt="Card drawn from deck to bot hand"
        class="draw-floating-card-image"
      >
    </div>

    <!-- Floating trick cards (towards trick slots) -->
    <div
      v-for="fc in trickFloatingCards"
      :key="fc.key"
      class="trick-floating-card"
      :style="fc.style"
    >
      <img
        :src="fc.imgUrl"
        alt="Trick card"
        class="trick-floating-card-image trump-image-bold"
      >
    </div>
  </section>
</template>

<style scoped>
.board {
  position: relative;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  padding: 1rem;
  margin-bottom: 1.25rem;
}

/* OPPONENT HAND ON TOP */
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

/* main layout */
.board-layout {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
}

/* center */
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

/* unified size for cards in play + deck + trump */
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

/* right side */
.side-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-self: end;
}

.deck-stack {
  position: relative;
  width: 140px;
  height: 120px;
}

/* Trump: center, rotated */
.trump-image {
  position: absolute;
  top: 50%;
  left: 40%;
  transform: translate(-50%, -50%) rotate(90deg);
  transform-origin: center center;
  z-index: 1;
}

/* Deck: slightly to the right, vertical */
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

.trick-slot {
  position: absolute;
  width: 80px;
  height: 120px;
  pointer-events: none;
}

/* top-left corner (bot) */
.trick-slot--bot {
  top: 8px;
  left: 8px;
}

/* bottom-left corner (player) */
.trick-slot--player {
  bottom: 8px;
  left: 8px;
}

.trick-floating-card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.35);
}
</style>
