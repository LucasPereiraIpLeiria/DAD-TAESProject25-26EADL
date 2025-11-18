<script setup>
import { onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBiscaStore } from '@/stores/bisca'

const bisca = useBiscaStore()
const route = useRoute()
const router = useRouter()

// se não vier modo, cai em 'practice'
const mode = computed(() => {
  const m = route.params.mode
  return (m === 'competitive' || m === 'practice') ? m : 'practice'
})

onMounted(() => {
  bisca.startMatch({ mode: 'practice' })
})

// se alguém mudar o :mode na URL estando nesta página
watch(mode, (newMode) => {
  bisca.startMatch({ mode: newMode })
})

const isPlayerTurn = computed(
  () => bisca.status === 'in_game' && bisca.currentTurn === 'player'
)

function play(card) {
  if (!isPlayerTurn.value) return
  bisca.playCard(card)
}

function nextGame() {
  bisca.startGame()
}

function restartMatch() {
  bisca.startMatch({ mode: 'practice' })
}
</script>

<template>
  <main style="padding: 1.5rem; max-width: 600px;">
    <h1>Bisca — Single Player</h1>

    <!-- INFO GERAL DO MATCH / GAME -->
    <section style="margin-bottom: 1rem;">
      <p><strong>Modo:</strong> {{ mode }}</p>
      <p><strong>Estado:</strong> {{ bisca.status }}</p>
      <p><strong>Game:</strong> {{ bisca.currentGameNumber }}</p>
      <p><strong>Marks:</strong> {{ bisca.playerMarks }} - {{ bisca.botMarks }}</p>
      <p v-if="bisca.status === 'in_game'">
        <strong>Vez de:</strong>
        <span v-if="isPlayerTurn">Tu</span>
        <span v-else>Bot</span>
      </p>
      <p v-if="bisca.trumpCard">
        <strong>Trunfo:</strong>
        {{ bisca.trumpCard.suit }} {{ bisca.displayRank(bisca.trumpCard.rank) }}
      </p>

      <p>
        <strong>Fase:</strong>
        {{ bisca.phase === 'draw_phase' ? 'Biscar (stock ainda existe)' : 'Fase final (obrigado a seguir naipe)'
        }}
      </p>

      <p>
        <strong>Pontos (game atual):</strong>
        You: {{ bisca.playerPoints }} — {{ bisca.botPoints }} :Bot
      </p>

      <p>
        <strong>Cartas no stock:</strong> {{ bisca.stock.length }}
      </p>
    </section>

    <!-- MESA -->
    <section v-if="bisca.status === 'in_game'" style="margin-bottom: 1rem;">
      <h2>Mesa</h2>
      <p>
        <strong>Player:</strong>
        <span v-if="bisca.tableCards.player">
          {{ bisca.tableCards.player.suit }} {{ bisca.displayRank(bisca.tableCards.player.rank) }}
        </span>
        <span v-else>—</span>
      </p>
      <p>
        <strong>Bot:</strong>
        <span v-if="bisca.tableCards.bot">
          {{ bisca.tableCards.bot.suit }} {{ bisca.displayRank(bisca.tableCards.bot.rank) }}
        </span>
        <span v-else>—</span>
      </p>
    </section>

    <!-- MÃO DO PLAYER -->
    <section v-if="bisca.status === 'in_game'" style="margin-bottom: 1rem;">
      <h2>Mão do jogador:</h2>
      <button v-for="card in bisca.playerHand" :key="card.id" type="button" @click="play(card)"
        :disabled="!isPlayerTurn" style="margin-right: .5rem; margin-bottom: .5rem;" :style="{
          cursor: isPlayerTurn ? 'pointer' : 'not-allowed'
        }">
        {{ card.suit }} {{ bisca.displayRank(card.rank) }}
      </button>
      <p v-if="bisca.playerHand.length === 0">Sem cartas na mão.</p>
    </section>


    <!-- FIM DE GAME (MAS MATCH AINDA NÃO ACABOU) -->
    <section v-if="bisca.status === 'between_games'" style="margin-top: 1.5rem;">
      <h2>Game terminado</h2>
      <p>Pontos deste game: {{ bisca.playerPoints }} - {{ bisca.botPoints }}</p>
      <p>Marks: {{ bisca.playerMarks }} - {{ bisca.botMarks }}</p>
      <button type="button" @click="nextGame()">Começar próximo game</button>
    </section>

    <!-- FIM DE MATCH -->
    <section v-if="bisca.status === 'match_finished' && bisca.summary" style="margin-top: 1.5rem;">
      <h2>Match terminado</h2>
      <p>
        <strong>Resultado:</strong>
        {{ bisca.summary.result === 'win' ? 'Vitória' : 'Derrota' }}
      </p>
      <p><strong>Marks:</strong> {{ bisca.summary.playerMarks }} - {{ bisca.summary.botMarks }}</p>
      <p><strong>Pontos (último game):</strong> {{ bisca.summary.playerPoints }} - {{ bisca.summary.botPoints }}
      </p>

      <button type="button" @click="restartMatch()">Novo match</button>
    </section>
  </main>
</template>
