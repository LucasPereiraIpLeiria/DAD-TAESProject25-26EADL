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
})

const emit = defineEmits(['play-card'])

function onPlay(card) {
  if (!props.isPlayerTurn) return
  emit('play-card', card)
}

// Carrega imagens de cartas
const cardImages = import.meta.glob('/src/assets/images/cards/*.png', {
  eager: true,
  import: 'default',
})

const deckBackImageUrl = cardImages['/src/assets/images/cards/back.png'] || ''

function suitToLetter(suit) {
  switch (suit) {
    case '♥':
      return 'c' // copas
    case '♦':
      return 'o' // ouros
    case '♠':
      return 'e' // espadas
    case '♣':
      return 'p' // paus
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
      <h2>As tuas cartas</h2>
      <span
        v-if="!isPlayerTurn"
        class="hand-hint"
      >
        Aguarda a jogada do bot…
      </span>
      <span
        v-else
        class="hand-hint hand-hint--active"
      >
        A tua vez — escolhe uma carta.
      </span>
    </div>

    <div class="hand-row">
      <button
        v-for="card in bisca.playerHand"
        :key="card.id"
        type="button"
        class="card-btn"
        :class="{ 'card-btn--disabled': !isPlayerTurn }"
        :disabled="!isPlayerTurn"
        @click="onPlay(card)"
      >
        <img
          :src="getCardImageUrl(card)"
          :alt="`Carta ${card.suit} ${bisca.displayRank(card.rank)}`"
          class="hand-card-image"
        >
      </button>

      <p
        v-if="bisca.playerHand.length === 0"
        class="hand-empty"
      >
        Sem cartas na mão.
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

.hand-header h2 {
  margin: 0;
  font-size: 1rem;
}

.hand-hint {
  font-size: 0.8rem;
  color: #6b7280;
}

.hand-hint--active {
  color: #16a34a;
}

.hand-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

/* carta como frame para imagem */
.card-btn {
  width: 70px;
  height: 100px;
  padding: 0;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.05s, box-shadow 0.1s;
}

.card-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.25);
}

.card-btn--disabled {
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.hand-card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10px;
}

.hand-empty {
  font-size: 0.85rem;
  color: #6b7280;
}
</style>
