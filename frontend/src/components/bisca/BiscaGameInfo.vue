<script setup>
import InfoBlock from '@/components/ui/InfoBlock.vue'

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
</script>

<template>
  <section class="info-grid">
    <InfoBlock
      v-if="gametype === 'match'"
      label="Game"
    >
      {{ bisca.currentGameNumber }}
    </InfoBlock>

    <InfoBlock
      v-if="gametype === 'match'"
      label="Marks"
    >
      {{ bisca.playerMarks }} — {{ bisca.botMarks }}
    </InfoBlock>

    <InfoBlock label="Pontos (game)">
      Tu {{ bisca.playerPoints }} — {{ bisca.botPoints }} Bot
    </InfoBlock>

    <InfoBlock label="Fase">
      {{
        bisca.phase === 'draw_phase'
          ? 'Biscar (stock ainda existe)'
          : 'Fase final (obrigado a seguir naipe)'
      }}
    </InfoBlock>

  </section>
</template>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.6rem;
  margin-bottom: 1.25rem;
}
</style>
