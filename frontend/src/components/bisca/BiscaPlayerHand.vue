<script setup>
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

function onPlay(card) {
  if (!props.isPlayerTurn) return
  emit('play-card', card)
}

// Card images
const cardImages = import.meta.glob('/src/assets/images/cards/*.png', {
  eager: true,
  import: 'default',
})
const deckBackImageUrl =
  cardImages['/src/assets/images/cards/back.png'] || ''

function suitToLetter(suit) {
  switch (suit) {
    case '♥':
      return 'c'
    case '♦':
      return 'o'
    case '♠':
      return 'e'
    case '♣':
      return 'p'
    default:
      return ''
  }
}

function getCardImageUrl(card) {
  if (!card) return ''
  const letter = suitToLetter(card.suit)
  if (!letter) return deckBackImageUrl
  const key = `/src/assets/images/cards/${letter}${card.rank}.png`
  const img = cardImages[key]
  return img || deckBackImageUrl || ''
}
</script>

<template>
  <section class="hand-section">
    <div class="hand-header">
      <span
        v-if="!isPlayerTurn"
        class="hand-hint"
      >
        Waiting for the opponent...
      </span>
      <span
        v-else-if="mustFollowSuit"
        class="hand-hint hand-hint--warning"
      >
        You must follow suit — pick a card of the same suit.
      </span>
      <span
        v-else
        class="hand-hint hand-hint--active"
      >
        Your turn — choose a card.
      </span>
    </div>

    <div class="hand-row player-hand-row">
      <button
        v-for="card in bisca.playerHand"
        :id="`hand-card-${card.id}`"
        :key="card.id"
        type="button"
        class="card-btn"
        :class="{ 'card-btn--disabled': !isPlayerTurn }"
        :disabled="!isPlayerTurn"
        v-motion
        :initial="{ y: 0, scale: 1 }"
        :hover="isPlayerTurn ? { y: -6, scale: 1.05 } : {}"
        :tap="isPlayerTurn ? { scale: 0.95 } : {}"
        @click="onPlay(card)"
      >
        <img
          :src="getCardImageUrl(card)"
          :alt="`Card ${card.suit} ${bisca.displayRank(card.rank)}`"
          class="hand-card-image hand-card-image-bold"
        >
      </button>

      <p
        v-if="bisca.playerHand.length === 0"
        class="hand-empty"
      >
        No cards in hand.
      </p>
    </div>
  </section>
</template>

<style scoped>
.hand-section {
  margin-top: 0.5rem;
}

.hand-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.4rem;
}

.hand-hint {
  font-size: 0.8rem;
  color: #6b7280;
}

.hand-hint--active {
  color: #16a34a;
}

.hand-hint--warning {
  color: #b91c1c;
  font-weight: 600;
}

.hand-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.4rem;
  justify-content: center;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  min-height: 130px;
  align-items: center;
}

.card-btn {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-block;
  flex: 0 0 auto;
  line-height: 0;
}

.card-btn--disabled {
  cursor: not-allowed;
}

.hand-card-image {
  width: 80px;
  height: 120px;
  display: block;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.25);
}

.hand-card-image-bold {
  outline: 2px solid #111827;
}

.hand-empty {
  font-size: 0.85rem;
  color: #6b7280;
}
</style>
