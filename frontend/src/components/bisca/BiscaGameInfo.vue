<script setup>
import InfoBlock from '@/components/ui/InfoBlock.vue'

const props = defineProps({
  bisca: {
    type: Object,
    required: true,
  },
  gametype: {
    type: String,
    required: true, // 'practice' | 'match'
  },
})

const suitColor = {
  '♥': 'red',
  '♦': 'red',
  '♠': 'black',
  '♣': 'black',
}

const suitName = {
  '♥': 'Hearts',
  '♦': 'Diamonds',
  '♠': 'Spades',
  '♣': 'Clubs',
}
</script>

<template>
  <section class="info-grid">

    <!-- Match only -->
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

    <!-- Points -->
    <InfoBlock label="Points (game)">
      You {{ bisca.playerPoints }} — {{ bisca.botPoints }} Bot
    </InfoBlock>

    <!-- Deck size -->
    <InfoBlock label="Deck">
      {{ bisca.stock.length }} cards
    </InfoBlock>

    <!-- Trump -->
    <InfoBlock label="Trump">
      <span
        v-if="bisca.trumpCard"
        :style="{ color: suitColor[bisca.trumpCard.suit] }"
      >
        {{ bisca.trumpCard.suit }} {{ suitName[bisca.trumpCard.suit] }}
      </span>
      <span v-else>—</span>
    </InfoBlock>

    <!-- Phase -->
    <InfoBlock label="Phase">
      {{
        bisca.phase === 'draw_phase'
          ? 'Draw phase'
          : 'Final phase (follow suit)'
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
