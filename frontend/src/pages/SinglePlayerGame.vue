<script setup>
import { onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBiscaStore } from '@/stores/bisca'

const bisca = useBiscaStore()
const route = useRoute()

const mode = computed(() => {
  const m = route.params.mode
  return (m === 'competitive' || m === 'practice') ? m : 'practice'
})

const gametype = computed(() => {
  const g = route.params.gametype
  return (g === 'standalone' || g === 'match') ? g : 'standalone'
})

const variant = computed(() => {
  const v = route.params.variant
  return (v === '3' || v === '9') ? v : '9'
})

onMounted(() => {
  if (gametype.value === 'match') {
    bisca.startMatch({
      mode: mode.value,
      gametype: gametype.value,
      variant: variant.value
    })
  } else {
    bisca.startGame({
      mode: mode.value,
      gametype: gametype.value,
      variant: variant.value
    })
  }
})

watch([mode, gametype, variant], () => {
  if (gametype.value === 'match') {
    bisca.startMatch({
      mode: mode.value,
      gametype: gametype.value,
      variant: variant.value
    })
  } else {
    bisca.startGame({
      mode: mode.value,
      gametype: gametype.value,
      variant: variant.value
    })
  }
})

const isPlayerTurn = computed(
  () => bisca.status === 'in_game' && bisca.currentTurn === 'player'
)

function play(card) {
  if (!isPlayerTurn.value) return
  bisca.playCard(card)
}

function nextGame() {
  bisca.startGame({
    mode: mode.value,
    gametype: gametype.value,
    variant: variant.value
  })
}

function restartMatch() {
  bisca.startMatch({
    mode: mode.value,
    gametype: gametype.value,
    variant: variant.value
  })
}
</script>

<template>
  <main class="game-container">
    <section class="game-card">
      <!-- HEADER -->
      <header class="game-header">
        <div>
          <h1>Bisca — Single Player</h1>
          <p>Joga contra o bot seguindo as regras oficiais de Bisca.</p>
        </div>

        <div class="pill-row">
          <span class="pill">
            {{ mode === 'competitive' ? 'Competitive' : 'Practice' }}
          </span>
          <span class="pill">
            {{ gametype === 'match' ? 'Match' : 'Standalone' }}
          </span>
          <span class="pill">
            {{ variant === '3' ? 'Bisca de 3' : 'Bisca de 9' }}
          </span>
        </div>
      </header>

      <!-- INFO GERAL -->
      <section class="info-grid">
        <div class="info-block">
          <p class="info-label">Estado</p>
          <p class="info-value">{{ bisca.status }}</p>
        </div>

        <div v-if="gametype === 'match'" class="info-block">
          <p class="info-label">Game</p>
          <p class="info-value">{{ bisca.currentGameNumber }}</p>
        </div>

        <div v-if="gametype === 'match'" class="info-block">
          <p class="info-label">Marks</p>
          <p class="info-value">
            {{ bisca.playerMarks }} — {{ bisca.botMarks }}
          </p>
        </div>

        <div class="info-block">
          <p class="info-label">Pontos (game)</p>
          <p class="info-value">
            Tu {{ bisca.playerPoints }} — {{ bisca.botPoints }} Bot
          </p>
        </div>

        <div class="info-block" v-if="bisca.trumpCard">
          <p class="info-label">Trunfo</p>
          <p class="info-value">
            {{ bisca.trumpCard.suit }} {{ bisca.displayRank(bisca.trumpCard.rank) }}
          </p>
        </div>

        <div class="info-block">
          <p class="info-label">Fase</p>
          <p class="info-value">
            {{ bisca.phase === 'draw_phase'
              ? 'Biscar (stock ainda existe)'
              : 'Fase final (obrigado a seguir naipe)' }}
          </p>
        </div>

        <div class="info-block">
          <p class="info-label">Cartas no stock</p>
          <p class="info-value">{{ bisca.stock.length }}</p>
        </div>

        <div class="info-block" v-if="bisca.status === 'in_game'">
          <p class="info-label">Vez de</p>
          <p class="info-value" :class="{ 'info-turn--you': isPlayerTurn, 'info-turn--bot': !isPlayerTurn }">
            {{ isPlayerTurn ? 'Tu' : 'Bot' }}
          </p>
        </div>
      </section>

      <!-- TABULEIRO / MESA -->
      <section class="board" v-if="bisca.status === 'in_game'">
        <div class="player-row bot-row">
          <div class="player-label">Bot</div>
          <div class="card-slot">
            <span v-if="bisca.tableCards.bot" class="table-card">
              {{ bisca.tableCards.bot.suit }}
              {{ bisca.displayRank(bisca.tableCards.bot.rank) }}
            </span>
            <span v-else class="table-card table-card--empty">—</span>
          </div>
        </div>

        <div class="center-row">
          <div class="stock-box">
            <p class="stock-label">Stock</p>
            <p class="stock-count">{{ bisca.stock.length }}</p>
          </div>
          <div class="stock-box" v-if="bisca.trumpCard">
            <p class="stock-label">Trunfo</p>
            <p class="stock-trump">
              {{ bisca.trumpCard.suit }}
              {{ bisca.displayRank(bisca.trumpCard.rank) }}
            </p>
          </div>
        </div>

        <div class="player-row you-row">
          <div class="player-label">Tu</div>
          <div class="card-slot">
            <span v-if="bisca.tableCards.player" class="table-card table-card--you">
              {{ bisca.tableCards.player.suit }}
              {{ bisca.displayRank(bisca.tableCards.player.rank) }}
            </span>
            <span v-else class="table-card table-card--empty">—</span>
          </div>
        </div>
      </section>

      <!-- MÃO DO PLAYER -->
      <section
        v-if="bisca.status === 'in_game'"
        class="hand-section"
      >
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
              'card-btn--disabled': !isPlayerTurn,
            }"
            :disabled="!isPlayerTurn"
            @click="play(card)"
          >
            <span class="card-suit">{{ card.suit }}</span>
            <span class="card-rank">{{ bisca.displayRank(card.rank) }}</span>
          </button>

          <p v-if="bisca.playerHand.length === 0" class="hand-empty">
            Sem cartas na mão.
          </p>
        </div>
      </section>

      <!-- FIM DE GAME (MAS MATCH AINDA NÃO ACABOU) -->
      <section
        v-if="bisca.status === 'between_games'"
        class="end-panel"
      >
        <h2>Game terminado</h2>
        <p>Pontos deste game: {{ bisca.playerPoints }} - {{ bisca.botPoints }}</p>
        <p>Marks: {{ bisca.playerMarks }} - {{ bisca.botMarks }}</p>

        <button type="button" class="primary-btn" @click="nextGame">
          Começar próximo game
        </button>
      </section>

      <!-- FIM DE MATCH / STANDALONE -->
      <section
        v-if="bisca.status === 'match_finished' && bisca.summary"
        class="end-panel"
      >
        <h2>Match terminado</h2>

        <p class="end-result">
          <strong>Resultado:</strong>
          {{ bisca.summary.result === 'win' ? 'Vitória' : 'Derrota' }}
        </p>

        <p><strong>Marks:</strong> {{ bisca.summary.playerMarks }} - {{ bisca.summary.botMarks }}</p>
        <p><strong>Pontos (último game):</strong> {{ bisca.summary.playerPoints }} - {{ bisca.summary.botPoints }}</p>

        <button type="button" class="primary-btn" @click="restartMatch">
          Novo match
        </button>
      </section>
    </section>
  </main>
</template>

<style scoped>
.game-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: #f5f5f5;
}

.game-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem 2rem;
  max-width: 720px;
  width: 100%;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12);
}

/* HEADER */

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.game-header h1 {
  margin: 0;
  font-size: 1.4rem;
}

.game-header p {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
}

.pill {
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: #f3f4f6;
  color: #111827;
}

/* INFO GRID */

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.6rem;
  margin-bottom: 1.25rem;
}

.info-block {
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.info-label {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
}

.info-value {
  margin: 0.1rem 0 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: #111827;
}

.info-turn--you {
  color: #16a34a;
}

.info-turn--bot {
  color: #dc2626;
}

/* BOARD */

.board {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  padding: 0.9rem 0.9rem 1.1rem;
  margin-bottom: 1.25rem;
}

.player-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #4b5563;
}

.card-slot {
  min-width: 120px;
  display: flex;
  justify-content: center;
}

.table-card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 0.4rem 0.75rem;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
}

.table-card--you {
  border-color: #111827;
}

.table-card--empty {
  color: #9ca3af;
  font-weight: 400;
}

.center-row {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin: 0.6rem 0;
}

.stock-box {
  min-width: 100px;
  padding: 0.35rem 0.6rem;
  border-radius: 10px;
  border: 1px dashed #d1d5db;
  background: #e5e7eb;
  text-align: center;
}

.stock-label {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7280;
}

.stock-count,
.stock-trump {
  margin: 0.15rem 0 0;
  font-size: 0.9rem;
  font-weight: 600;
}

/* HAND */

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
}

.card-btn {
  min-width: 70px;
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

/* END PANELS */

.end-panel {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.end-panel h2 {
  margin: 0 0 0.4rem;
  font-size: 1.1rem;
}

.end-panel p {
  margin: 0.15rem 0;
  font-size: 0.9rem;
}

.end-result {
  margin-top: 0.4rem;
}

.primary-btn {
  margin-top: 0.7rem;
  padding: 0.55rem 1.4rem;
  border-radius: 999px;
  border: none;
  background: #111827;
  color: #f9fafb;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.05s;
}

.primary-btn:hover {
  background: #0f172a;
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .game-card {
    padding: 1.25rem 1.25rem 1.5rem;
  }

  .game-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .pill-row {
    justify-content: flex-start;
  }
}
</style>
