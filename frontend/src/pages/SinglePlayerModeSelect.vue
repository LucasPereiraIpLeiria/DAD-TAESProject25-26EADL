<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// opções
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

// estado selecionado (defaults razoáveis)
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
  <main class="sp-container">
    <section class="sp-card">
      <header class="sp-header">
        <h1>Single Player</h1>
        <p>Escolhe o modo, tipo de jogo e variante de Bisca.</p>
      </header>

      <!-- MODO -->
      <section class="sp-section">
        <h2>Mode</h2>
        <div class="sp-options-row">
          <button
            v-for="m in modes"
            :key="m.value"
            type="button"
            class="sp-option"
            :class="{ 'sp-option--active': selectedMode === m.value }"
            @click="selectMode(m.value)"
          >
            <span class="sp-option-title">{{ m.label }}</span>
            <span class="sp-option-desc">{{ m.description }}</span>
          </button>
        </div>
      </section>

      <!-- TIPO DE JOGO -->
      <section class="sp-section">
        <h2>Game Type</h2>
        <div class="sp-options-row">
          <button
            v-for="t in gameTypes"
            :key="t.value"
            type="button"
            class="sp-option"
            :class="{ 'sp-option--active': selectedGameType === t.value }"
            @click="selectGameType(t.value)"
          >
            <span class="sp-option-title">{{ t.label }}</span>
            <span class="sp-option-desc">{{ t.description }}</span>
          </button>
        </div>
      </section>

      <!-- VARIANTE -->
      <section class="sp-section">
        <h2>Variant</h2>
        <div class="sp-options-row">
          <button
            v-for="v in variants"
            :key="v.value"
            type="button"
            class="sp-option"
            :class="{ 'sp-option--active': selectedVariant === v.value }"
            @click="selectVariant(v.value)"
          >
            <span class="sp-option-title">{{ v.label }}</span>
            <span class="sp-option-desc">{{ v.description }}</span>
          </button>
        </div>
      </section>

      <!-- START -->
      <footer class="sp-footer">
        <button type="button" class="sp-start-btn" @click="startGame">
          Start Game
        </button>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.sp-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: #f5f5f5;
}

.sp-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem 2rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12);
}

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

.sp-option {
  flex: 1 1 0;
  min-width: 140px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 0.6rem 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.05s;
}

.sp-option:hover {
  transform: translateY(-1px);
  border-color: #d1d5db;
}

.sp-option--active {
  background: #111827;
  border-color: #111827;
  color: #f9fafb;
}

.sp-option-title {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
}

.sp-option-desc {
  display: block;
  font-size: 0.75rem;
  opacity: 0.8;
}

.sp-footer {
  margin-top: 1.25rem;
  display: flex;
  justify-content: center;
}

.sp-start-btn {
  padding: 0.6rem 1.5rem;
  border-radius: 999px;
  border: none;
  background: #111827;
  color: #f9fafb;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.05s;
}

.sp-start-btn:hover {
  background: #0f172a;
  transform: translateY(-1px);
}
</style>
