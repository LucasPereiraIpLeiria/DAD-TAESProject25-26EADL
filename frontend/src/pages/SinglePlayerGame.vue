<script setup>
import { onMounted } from 'vue'
import { useBiscaStore } from '@/stores/bisca'

const bisca = useBiscaStore()

onMounted(() => {
  bisca.startMatch({ mode: 'practice' })
})

function play(carta) {
  bisca.playCard(carta)
}
</script>

<template>
  <div class="game">
    <h1>Bisca — Single Player</h1>

    <div v-if="bisca.status === 'match_finished'">
      <h2>Match Finished</h2>
      <pre>{{ bisca.summary }}</pre>
    </div>

    <div v-else>
      <h2>Trunfo: {{ bisca.trumpCard?.suit }} {{ bisca.trumpCard?.rank }}</h2>

      <p><strong>Mão do jogador:</strong></p>
      <button 
        v-for="card in bisca.playerHand" 
        :key="card.id"
        @click="play(card)"
      >
        {{ card.suit }} {{ card.rank }}
      </button>

      <p><strong>Mesa:</strong></p>
      <p>Player: {{ bisca.tableCards.player }}</p>
      <p>Bot: {{ bisca.tableCards.bot }}</p>

      <p><strong>Pontos:</strong> {{ bisca.playerPoints }} - {{ bisca.botPoints }}</p>
    </div>
  </div>
</template>
