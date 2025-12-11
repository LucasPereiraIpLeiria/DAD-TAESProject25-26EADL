<script setup>
import UiPill from '@/components/ui/UiPill.vue'

const props = defineProps({
  gametype: {
    type: String,
    required: true, // 'practice' | 'match'
  },
  variant: {
    type: String,
    required: true, // '3' | '9'
  },
})
</script>

<template>
  <header class="game-header">
    <div>
      <h1>Bisca — Single Player</h1>
      <p>
        {{
          gametype === 'match'
            ? 'Match against the bot, with coins and history tracking.'
            : 'Casual practice game against the bot.'
        }}
      </p>
    </div>

    <div class="pill-row">
      <UiPill>
        {{ gametype === 'match' ? 'Match' : 'Practice' }}
      </UiPill>
      <UiPill>
        {{ variant === '3' ? 'Bisca of 3' : 'Bisca of 9' }}
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
