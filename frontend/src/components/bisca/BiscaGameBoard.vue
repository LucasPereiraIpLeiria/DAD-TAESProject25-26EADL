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
</script>

<template>
  <section class="board">
    <div class="board-layout">

      <!-- CARTAS JOGADAS AO CENTRO -->
      <div class="center-cards">
        <!-- Bot -->
        <span v-if="bisca.tableCards.bot" class="table-card">
          {{ bisca.tableCards.bot.suit }}
          {{ bisca.displayRank(bisca.tableCards.bot.rank) }}
        </span>
        <span v-else class="table-card table-card--empty">—</span>

        <!-- Tu -->
        <span v-if="bisca.tableCards.player" class="table-card table-card--you">
          {{ bisca.tableCards.player.suit }}
          {{ bisca.displayRank(bisca.tableCards.player.rank) }}
        </span>
        <span v-else class="table-card table-card--empty">—</span>
      </div>

      <!-- STOCK E TRUNFO À DIREITA -->
      <div class="side-info">
        <div class="stock-box">
          <p class="stock-label">Stock</p>
          <p class="stock-count">{{ bisca.stock.length }}</p>
        </div>

        <div v-if="bisca.trumpCard" class="stock-box">
          <p class="stock-label">Trunfo</p>
          <p class="stock-trump">
            {{ bisca.trumpCard.suit }}
            {{ bisca.displayRank(bisca.trumpCard.rank) }}
          </p>
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

/* layout geral: 2 colunas → centro + direita */
.board-layout {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
}

/* cartas jogadas ao centro */
.center-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  justify-self: center; /* 👈 garante que ficam mesmo ao centro da board */
}

/* stock e trunfo à direita */
.side-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  justify-self: end;     /* 👈 encosta à direita da board */
}

/* cartas */
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

.table-card--you {
  border-color: #111827;
}

.table-card--empty {
  color: #9ca3af;
  font-weight: 400;
}

/* stock/trunfo */
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

</style>
