<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToMode(mode) {
  router.push({ name: 'singleplayer', params: { mode } })
}
</script>

<template>
  <main style="padding: 1.5rem;">
    <h1>Single Player</h1>
    <p>Escolhe o modo de jogo:</p>

    <button type="button" @click="goToMode('practice')">
      Practice
    </button>

    <button type="button" @click="goToMode('competitive')" style="margin-left: .5rem;">
      Competitive
    </button>
  </main>
</template>
