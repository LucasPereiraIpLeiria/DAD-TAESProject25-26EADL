<script setup>
import PrimaryButton from '@/components/ui/PrimaryButton.vue'

const props = defineProps({
  bisca: {
    type: Object,
    required: true
  },
  gametype: {
    type: String,
    required: true
  }
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

    <PrimaryButton type="button" @click="handleNextGame">
      Começar próximo game
    </PrimaryButton>
  </section>

  <!-- Fim de match / standalone -->
  <section v-else-if="bisca.status === 'match_finished' && bisca.summary" class="end-panel">
    <h2>{{ gametype === 'standalone' ? 'Game terminado' : 'Match terminado' }}</h2>

    <p class="end-result">
      <strong>Resultado:</strong>
      {{ bisca.summary.result === 'win' ? 'Vitória' : 'Derrota' }}
    </p>

    <p v-if="gametype === 'match'">
      <strong>Marks:</strong>
      {{ bisca.summary.playerMarks }} - {{ bisca.summary.botMarks }}
    </p>

    <p>
      <strong>{{ gametype === 'standalone' ? 'Pontos:' : 'Pontos (último game):' }}</strong>
      {{ bisca.summary.playerPoints }} - {{ bisca.summary.botPoints }}
    </p>

    <p v-if="bisca.summary.result === 'win' && bisca.summary.coinsAwarded != null" class="coins-awarded">
      <strong>Coins ganhos:</strong>
      +{{ bisca.summary.coinsAwarded }}
    </p>

    <PrimaryButton type="button" @click="handleExit">
      Voltar à seleção
    </PrimaryButton>
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
</style>
