<script setup>
import UiPill from '@/components/ui/UiPill.vue'

const props = defineProps({
  mode: {
    type: String,
    required: true
  },
  gametype: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    required: true
  }
})
</script>

<template>
  <header class="game-header">
    <div>
      <h1>Bisca — Single Player</h1>
      <p>Joga contra o bot seguindo as regras oficiais de Bisca.</p>
    </div>

    <div class="pill-row">
      <UiPill>
        {{ mode === 'competitive' ? 'Competitive' : 'Practice' }}
      </UiPill>

      <UiPill>
        {{ gametype === 'match' ? 'Match' : 'Standalone' }}
      </UiPill>

      <UiPill>
        {{ variant === '3' ? 'Bisca de 3' : 'Bisca de 9' }}
      </UiPill>
    </div>
  </header>
</template>

<style scoped>
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.game-header h1 {
  margin: 0;
  font-size: 1.4rem;
}

.game-header p {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .game-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .pill-row {
    justify-content: flex-start;
  }
}
</style>
