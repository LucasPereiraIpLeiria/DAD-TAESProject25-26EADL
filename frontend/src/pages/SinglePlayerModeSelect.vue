<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PageContainer from '@/components/ui/PageContainer.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import UiOptionTile from '@/components/ui/UiOptionTile.vue'
import UiCard from '@/components/ui/UiCard.vue'

const auth = useAuthStore()
const router = useRouter()

const gameTypes = computed(() => {
  const base = [
    {
      value: 'practice',
      label: 'Practice',
      description: 'A single practice game against the bot, no coins involved.',
    },
  ]

  if (auth.isLoggedIn) {
    base.push({
      value: 'match',
      label: 'Match',
      description: 'A match up to 4 marks against the bot, with coins and tracking.',
    })
  }

  return base
})

const variants = [
  {
    value: '3',
    label: 'Bisca of 3',
    description: 'Starting hand of 3 cards.',
  },
  {
    value: '9',
    label: 'Bisca of 9',
    description: 'Starting hand of 9 cards.',
  },
]

const selectedGameType = ref('practice')
const selectedVariant = ref('9')

// Ensure "match" can't remain selected if the user logs out
watch(
  () => auth.isLoggedIn,
  (loggedIn) => {
    if (!loggedIn && selectedGameType.value === 'match') {
      selectedGameType.value = 'practice'
    }
  }
)

function selectGameType(value) {
  selectedGameType.value = value
}

function selectVariant(value) {
  selectedVariant.value = value
}

async function startGame() {
  const gametype = selectedGameType.value // 'practice' | 'match'
  const variant = selectedVariant.value

  router.push({
    name: 'singleplayer.game',
    params: {
      gametype,
      variant,
    },
  })
}
</script>

<template>
  <PageContainer max-width="sm">
    <UiCard padding="md" background="bg-white/90">
      <header class="sp-header">
        <h1>Single Player</h1>
        <p>Select the type of game and the Bisca variant.</p>
      </header>

      <!-- GAME TYPE -->
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

      <!-- VARIANT -->
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
