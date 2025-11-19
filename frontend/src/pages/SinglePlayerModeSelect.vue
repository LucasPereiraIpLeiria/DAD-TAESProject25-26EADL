<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageContainer from '@/components/ui/PageContainer.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import UiOptionTile from '@/components/ui/UiOptionTile.vue'
import UiCard from '@/components/ui/UiCard.vue'

const router = useRouter()

const modes = [
  { value: 'practice', label: 'Practice', description: 'Jogo casual, sem ranking' },
  { value: 'competitive', label: 'Competitive', description: 'Jogo competitivo' },
]

const gameTypes = [
  { value: 'standalone', label: 'Standalone', description: 'Um único jogo' },
  { value: 'match', label: 'Match', description: 'Match até 4 marks' },
]

const variants = [
  { value: '3', label: 'Bisca de 3', description: 'Mão inicial de 3 cartas' },
  { value: '9', label: 'Bisca de 9', description: 'Mão inicial de 9 cartas' },
]

const selectedMode = ref('practice')
const selectedGameType = ref('standalone')
const selectedVariant = ref('9')

function startGame() {
  router.push({
    name: 'singleplayer.game',
    params: {
      mode: selectedMode.value,
      gametype: selectedGameType.value,
      variant: selectedVariant.value,
    },
  })
}

function selectMode(value) {
  selectedMode.value = value
}

function selectGameType(value) {
  selectedGameType.value = value
}

function selectVariant(value) {
  selectedVariant.value = value
}
</script>

<template>
  <PageContainer max-width="sm">
    <UiCard padding="md">
    <header class="sp-header">
      <h1>Single Player</h1>
      <p>Escolhe o modo, tipo de jogo e variante de Bisca.</p>
    </header>

    <!-- MODO -->
    <section class="sp-section">
      <h2>Mode</h2>
      <div class="sp-options-row">
        <UiOptionTile
          v-for="m in modes"
          :key="m.value"
          :active="selectedMode === m.value"
          @click="selectMode(m.value)"
        >
          <template #title>{{ m.label }}</template>
          <template #description>{{ m.description }}</template>
        </UiOptionTile>
      </div>
    </section>

    <!-- TIPO DE JOGO -->
    <section class="sp-section">
      <h2>Game Type</h2>
      <div class="sp-options-row">
        <UiOptionTile
          v-for="t in gameTypes"
          :key="t.value"
          :active="selectedGameType === t.value"
          @click="selectGameType(t.value)"
        >
          <template #title>{{ t.label }}</template>
          <template #description>{{ t.description }}</template>
        </UiOptionTile>
      </div>
    </section>

    <!-- VARIANTE -->
    <section class="sp-section">
      <h2>Variant</h2>
      <div class="sp-options-row">
        <UiOptionTile
          v-for="v in variants"
          :key="v.value"
          :active="selectedVariant === v.value"
          @click="selectVariant(v.value)"
        >
          <template #title>{{ v.label }}</template>
          <template #description>{{ v.description }}</template>
        </UiOptionTile>
      </div>
    </section>

    <footer class="sp-footer">
      <PrimaryButton @click="startGame">
        Start Game
      </PrimaryButton>
    </footer>
    </UiCard>
  </PageContainer>
</template>

<style scoped>
.sp-header h1 {
  font-size: 1.5rem;
  margin: 0;
  text-align: center;
}

.sp-header p {
  margin-top: 0.25rem;
  margin-bottom: 1.25rem;
  text-align: center;
  font-size: 0.9rem;
  color: #6b7280;
}

.sp-section {
  margin-bottom: 1.25rem;
}

.sp-section h2 {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: #111827;
}

.sp-options-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sp-footer {
  margin-top: 1.25rem;
  display: flex;
  justify-content: center;
}
</style>
