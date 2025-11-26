<script setup>
import { onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBiscaStore } from '@/stores/bisca'

import PageContainer from '@/components/ui/PageContainer.vue'
import UiCard from '@/components/ui/UiCard.vue'

import BiscaGameHeader from '@/components/bisca/BiscaGameHeader.vue'
import BiscaGameInfo from '@/components/bisca/BiscaGameInfo.vue'
import BiscaGameBoard from '@/components/bisca/BiscaGameBoard.vue'
import BiscaPlayerHand from '@/components/bisca/BiscaPlayerHand.vue'
import BiscaEndPanel from '@/components/bisca/BiscaEndPanel.vue'

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

function startByRoute() {
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
}

onMounted(() => {
  startByRoute()
})

watch([mode, gametype, variant], () => {
  startByRoute()
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
  <PageContainer max-width="lg">
    <UiCard padding="md">
    <BiscaGameHeader
      :mode="mode"
      :gametype="gametype"
      :variant="variant"
    />

    <BiscaGameInfo
      :bisca="bisca"
      :gametype="gametype"
      :is-player-turn="isPlayerTurn"
    />

    <BiscaGameBoard
      v-if="bisca.status === 'in_game'"
      :bisca="bisca"
      :is-player-turn="isPlayerTurn"
    />

    <BiscaPlayerHand
      v-if="bisca.status === 'in_game'"
      :bisca="bisca"
      :is-player-turn="isPlayerTurn"
      @play-card="play"
    />

    <BiscaEndPanel
      v-if="bisca.status === 'between_games' || bisca.status === 'match_finished'"
      :bisca="bisca"
      :gametype="gametype"
      @next-game="nextGame"
      @restart-match="restartMatch"
    />
    </UiCard>
  </PageContainer>
</template>

<style scoped>
/* Nothing*/
</style>
