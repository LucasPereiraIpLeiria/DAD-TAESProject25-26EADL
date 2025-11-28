<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBiscaStore } from '@/stores/bisca'


import PageContainer from '@/components/ui/PageContainer.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import UiOptionTile from '@/components/ui/UiOptionTile.vue'
import UiCard from '@/components/ui/UiCard.vue'

const auth = useAuthStore()
const router = useRouter()

const modes = computed(() => {
  const base = [
    { value: 'practice', label: 'Practice', description: 'Jogo casual, sem ranking' },
  ]

  if (auth.isLoggedIn) {
    base.push({
      value: 'competitive',
      label: 'Competitive',
      description: 'Jogo competitivo'
    })
  }

  return base
})

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

//para o caso de o user perder o estado de login enquanto está na página, e caso tenha pré selecionado competitive
watch(
  () => auth.isLoggedIn,
  (loggedIn) => {
    if (!loggedIn && selectedMode.value === 'competitive') {
      selectedMode.value = 'practice'
    }
  }
)

async function startGame() {
  const mode = selectedMode.value
  const gametype = selectedGameType.value
  const variant = selectedVariant.value

  // se for practice → vai direto
  if (mode === 'practice') {
    router.push({ name: 'singleplayer.game', params: { mode, gametype, variant } })
    return
  }

  // competitive → verificar login e coins ANTES
  const bisca = useBiscaStore()

  const result = await bisca.tryStartCompetitiveMatch()

  if (!result.ok) {
    if (result.reason === 'not_authenticated') {
      alert('Tens de estar autenticado para jogar competitivo.')
    } else if (result.reason === 'insufficient_funds') {
      alert('Não tens moedas suficientes.')
    } else {
      alert('Não foi possível iniciar jogo competitivo.')
    }
    return
  }

  // Só aqui navega!
  router.push({ name: 'singleplayer.game', params: { mode, gametype, variant } })
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
