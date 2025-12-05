<script setup>
import PrimaryButton from '@/components/ui/PrimaryButton.vue'

const props = defineProps({
  bisca: {
    type: Object,
    required: true,
  },
  gametype: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['next-game', 'exit'])

function handleNextGame() {
  emit('next-game')
}

function handleExit() {
  emit('exit')
}
</script>

<template>
  <!-- Fim de game (mas match ainda não acabou) -->
  <section v-if="bisca.status === 'between_games'" class="end-panel">
    <h2>Game terminado</h2>
    <p>Pontos deste game: {{ bisca.playerPoints }} - {{ bisca.botPoints }}</p>
    <p>Marks: {{ bisca.playerMarks }} - {{ bisca.botMarks }}</p>

    <PrimaryButton type="button" @click="handleNextGame"> Começar próximo game </PrimaryButton>
  </section>

  <!-- Fim de match / standalone -->
  <section v-else-if="bisca.status === 'match_finished' && bisca.summary" class="end-panel">
    <h2>{{ gametype === 'standalone' ? 'Game terminado' : 'Match terminado' }}</h2>

    <p class="end-result">
      <strong>Resultado:</strong>
      {{ bisca.summary.result === 'win' ? 'Vitória' : 'Derrota' }}
    </p>

    <!-- Marks do match -->
    <p v-if="gametype === 'match'">
      <strong>Marks:</strong>
      {{ bisca.summary.playerMarks }} - {{ bisca.summary.botMarks }}
    </p>
    <!-- Pontos totais do match -->
    <p v-if="gametype === 'match'">
      <strong>Pontos totais do match:</strong>
      {{ bisca.matchPlayer1Points }} - {{ bisca.matchPlayer2Points }}
    </p>


    <p v-else>
      <strong>Pontos:</strong>
      {{ bisca.summary.playerPoints }} - {{ bisca.summary.botPoints }}
    </p>

    <!-- coins ganhos caso o user ganhe -->
    <p v-if="bisca.summary.result === 'win' && bisca.summary.coinsAwarded != null" class="coins-awarded">
      <strong>Coins ganhos:</strong>
      +{{ bisca.summary.coinsAwarded }}
    </p>
    <!-- Lista de games do match -->
    <!-- achievements só sao mostrados se forem alcançados pelo utilizador-->

    <div v-if="gametype === 'match' && bisca.matchGames && bisca.matchGames.length" class="games-list">
      <h3>Resultados por game</h3>
      <ul>
        <li v-for="g in bisca.matchGames" :key="g.gameNumber">
          <span class="game-label">Game {{ g.gameNumber }}:</span>
          <span class="game-score">
            {{ g.playerPoints }} - {{ g.botPoints }}
          </span>
          <span class="game-result">
            ·
            {{
              g.winner === 'player'
                ? 'Vitória'
                : g.winner === 'bot'
                  ? 'Derrota'
                  : 'Empate'
            }}
          </span>



          <!-- num match é impossivel haver dois achievements -->
          <span v-if="g.achievements?.bandeira" class="badge">
            Bandeira
          </span>
          <span v-else-if="g.achievements?.capote" class="badge">
            Capote
          </span>
        </li>
      </ul>
    </div>


    <PrimaryButton type="button" @click="handleExit"> Voltar à seleção </PrimaryButton>
  </section>
</template>

<style scoped>
.coins-awarded {
  margin-top: 0.6rem;
  padding: 0.35rem 0.6rem;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  display: inline-block;
}

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

.match-achievements {
  margin-top: 0.4rem;
  font-size: 0.9rem;
}

.games-list {
  margin-top: 0.75rem;
  text-align: left;
}

.games-list h3 {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
}

.games-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.games-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  padding: 0.15rem 0;
}

.game-label {
  font-weight: 600;
}

.game-score {
  font-variant-numeric: tabular-nums;
}

.game-result {
  opacity: 0.8;
}

.badge {
  padding: 0.1rem 0.35rem;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  font-size: 0.75rem;
}
</style>
