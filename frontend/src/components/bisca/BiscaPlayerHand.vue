<script setup>
const props = defineProps({
  bisca: {
    type: Object,
    required: true
  },
  isPlayerTurn: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['play-card'])

function onPlay(card) {
  if (!props.isPlayerTurn) return
  emit('play-card', card)
}
</script>

<template>
  <section class="hand-section">
    <div class="hand-header">
      <h2>As tuas cartas</h2>
      <span v-if="!isPlayerTurn" class="hand-hint">
        Aguarda a jogada do bot…
      </span>
      <span v-else class="hand-hint hand-hint--active">
        A tua vez — escolhe uma carta.
      </span>
    </div>

    <div class="hand-row">
      <button
        v-for="card in bisca.playerHand"
        :key="card.id"
        type="button"
        class="card-btn"
        :class="{
          'card-btn--disabled': !isPlayerTurn
        }"
        :disabled="!isPlayerTurn"
        @click="onPlay(card)"
      >
        <span class="card-suit">{{ card.suit }}</span>
        <span class="card-rank">{{ bisca.displayRank(card.rank) }}</span>
      </button>

      <p v-if="bisca.playerHand.length === 0" class="hand-empty">
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

.card-btn {
  min-width: 60px;
  padding: 0.35rem 0.6rem;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  cursor: pointer;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  transition: transform 0.05s, box-shadow 0.1s, border-color 0.1s, background 0.1s;
}

.card-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.15);
  border-color: #111827;
}

.card-btn--disabled {
  cursor: not-allowed;
  opacity: 0.55;
  box-shadow: none;
}

.card-suit {
  font-size: 0.9rem;
}

.card-rank {
  font-size: 1rem;
  font-weight: 600;
}

.hand-empty {
  font-size: 0.85rem;
  color: #6b7280;
}
</style>
