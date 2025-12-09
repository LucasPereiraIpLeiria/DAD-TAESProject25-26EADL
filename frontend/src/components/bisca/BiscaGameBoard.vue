<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

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

// ---------- IMAGENS DAS CARTAS ----------

/**
 * Carrega todas as imagens da pasta assets/images/cards
 * Exemplos esperados:
 *  - back.png (fallback)
 *  - back_default.png, back_wood.png, back_arcane.png, ...
 *  - c1.png … c13.png (copas)
 *  - o1.png … o13.png (ouros)
 *  - e1.png … e13.png (espadas)
 *  - p1.png … p13.png (paus)
 */
const cardImages = import.meta.glob('/src/assets/images/cards/*.png', {
  eager: true,
  import: 'default',
})

const defaultBack =
  cardImages['/src/assets/images/cards/back_default.png'] ||
  cardImages['/src/assets/images/cards/back.png'] ||
  ''

const auth = useAuthStore()

// deck selecionado no JSON do user
const selectedDeckKey = computed(() => auth.currentUser?.selected_deck || 'default')

/**
 * Mapa de deckKey → imagem de costas.
 * Ajusta as keys conforme os tipos de deck que tens na BD.
 */
const deckBackMap = computed(() => ({
  default:
    cardImages['/src/assets/images/cards/back_default.png'] ||
    cardImages['/src/assets/images/cards/back.png'] ||
    '',
  wood: cardImages['/src/assets/images/cards/back_wood.png'] || defaultBack,
  arcane: cardImages['/src/assets/images/cards/back_arcane.png'] || defaultBack,
  // adiciona aqui outros decks:
  // neon: cardImages['/src/assets/images/cards/back_neon.png'] || defaultBack,
}))

const deckBackImageUrl = computed(
  () => deckBackMap.value[selectedDeckKey.value] || defaultBack,
)

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
</script>

<template>
  <section class="board">
    <div class="board-layout">
      <!-- CARTAS JOGADAS AO CENTRO -->
      <div class="center-cards">
        <!-- Bot -->
        <div class="table-slot">
          <img
            v-if="bisca.tableCards.bot"
            :src="getCardImageUrl(bisca.tableCards.bot)"
            :alt="`Carta do bot ${bisca.tableCards.bot.suit} ${bisca.displayRank(bisca.tableCards.bot.rank)}`"
            class="table-card-image"
          >
          <span
            v-else
            class="table-card table-card--empty"
          >
            —
          </span>
        </div>

        <!-- Tu -->
        <div class="table-slot">
          <img
            v-if="bisca.tableCards.player"
            :src="getCardImageUrl(bisca.tableCards.player)"
            :alt="`Tua carta ${bisca.tableCards.player.suit} ${bisca.displayRank(bisca.tableCards.player.rank)}`"
            class="table-card-image table-card-image--you"
          >
          <span
            v-else
            class="table-card table-card--empty"
          >
            —
          </span>
        </div>
      </div>

      <!-- STOCK + TRUNFO à direita -->
      <div class="side-info">
        <!-- Deck vertical (imagem de costas do deck selecionado + contador) -->
        <div class="deck-stack">
          <img
            v-if="deckBackImageUrl"
            :src="deckBackImageUrl"
            alt="Monte de cartas"
            class="deck-image"
          >
          <span class="deck-count">
            {{ bisca.stock.length }}
          </span>
        </div>

        <!-- Trunfo horizontal por baixo do deck -->
        <div
          v-if="bisca.trumpCard"
          class="trump-wrapper"
        >
          <img
            :src="getCardImageUrl(bisca.trumpCard)"
            alt="Carta de trunfo"
            class="trump-image"
          >
        </div>
      </div>
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
}

.table-slot {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-card-image {
  width: 70px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.25);
}

.table-card-image--you {
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
  align-items: center;
  gap: 0.9rem;
  justify-self: end;
}

/* deck vertical */
.deck-stack {
  position: relative;
  width: 70px;
  height: 100px;
}

.deck-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.35);
}

.deck-count {
  position: absolute;
  right: -8px;
  bottom: -8px;
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
  border-radius: 999px;
  background: #111827;
  color: #f9fafb;
}

/* trunfo horizontal */
.trump-wrapper {
  width: 90px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trump-image {
  width: 90px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.3);
  transform: rotate(90deg);
  transform-origin: center center;
}
</style>
