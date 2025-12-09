<script setup>
import { computed } from 'vue'
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
</script>


<template>
  <section class="board">
    <!-- MÃO DO BOT POR CIMA DO GAMEBOARD -->
    <div v-if="bisca.botHand && bisca.botHand.length > 0" class="opponent-hand">
      <div v-for="card in bisca.botHand" :key="card.id" class="opponent-card">
        <img :src="deckBackImageUrl" alt="Carta do bot" class="opponent-card-image">
      </div>
    </div>

    <div class="board-layout">
      <!-- CARTAS JOGADAS AO CENTRO -->
      <div class="center-cards">
        <!-- Bot -->
        <div class="table-slot">
          <img v-if="bisca.tableCards.bot" :src="getCardImageUrl(bisca.tableCards.bot)"
            :alt="`Carta do bot ${bisca.tableCards.bot.suit} ${bisca.displayRank(bisca.tableCards.bot.rank)}`"
            class="table-card-image">
          <span v-else class="table-card table-card--empty">
            —
          </span>
        </div>

        <!-- Tu -->
        <div id="table-player-slot" class="table-slot">
          <img v-if="bisca.tableCards.player" :src="getCardImageUrl(bisca.tableCards.player)"
            :alt="`Tua carta ${bisca.tableCards.player.suit} ${bisca.displayRank(bisca.tableCards.player.rank)}`"
            class="table-card-image table-card-image--you">
          <span v-else class="table-card table-card--empty">
            —
          </span>
        </div>
      </div>

      <!-- DECK + TRUNFO à direita -->
      <div class="side-info">
        <div class="deck-stack">
          <!-- Trunfo por baixo, deitado -->
          <img v-if="bisca.trumpCard" :src="getCardImageUrl(bisca.trumpCard)" alt="Carta de trunfo" class="trump-image">

          <!-- Deck cover por cima -->
          <img v-if="deckBackImageUrl" :src="deckBackImageUrl" alt="Monte de cartas" class="deck-image">
        </div>
      </div>
    </div>

    <!-- MÃO DO PLAYER POR BAIXO DO GAMEBOARD, MAS AINDA DENTRO DO MESMO COMPONENTE -->
    <BiscaPlayerHand :bisca="bisca" :is-player-turn="isPlayerTurn" :must-follow-suit="mustFollowSuit"
      @play-card="onPlayCard" />
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
  transform: translateX(25px);
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
</style>
