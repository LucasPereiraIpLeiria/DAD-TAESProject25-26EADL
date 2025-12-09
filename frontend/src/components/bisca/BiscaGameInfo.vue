<script setup>
import InfoBlock from '@/components/ui/InfoBlock.vue'

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

const suitColor = {
  '♥': 'red',
  '♦': 'red',
  '♠': 'black',
  '♣': 'black',
}

const suitName = {
  '♥': 'Copas',
  '♦': 'Ouros',
  '♠': 'Espadas',
  '♣': 'Paus',
}

</script>

<template>
  <section class="info-grid">
    <InfoBlock v-if="gametype === 'match'" label="Game">
      {{ bisca.currentGameNumber }}
    </InfoBlock>

    <InfoBlock v-if="gametype === 'match'" label="Marks">
      {{ bisca.playerMarks }} — {{ bisca.botMarks }}
    </InfoBlock>

    <InfoBlock label="Pontos (game)">
      Tu {{ bisca.playerPoints }} — {{ bisca.botPoints }} Bot
    </InfoBlock>

    <InfoBlock label="Baralho">
      {{ bisca.stock.length }} cartas
    </InfoBlock>

    <InfoBlock label="Trunfo">
      <span v-if="bisca.trumpCard" :style="{
        color: suitColor[bisca.trumpCard.suit],
      }">

        {{ bisca.trumpCard.suit }} {{ suitName[bisca.trumpCard.suit] }}

      </span>

      <span v-else>—</span>
    </InfoBlock>

    <InfoBlock label="Fase">
      {{
        bisca.phase === 'draw_phase'
          ? 'Biscar'
          : 'Assistir'
      }}
    </InfoBlock>
  </section>
</template>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}
</style>
