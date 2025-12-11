<script setup>
const props = defineProps({
  maxWidth: {
    type: String,
    default: 'md',
    // 👇 agora também aceita 'xl'
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value),
  },
})
</script>

<template>
  <main class="page-container bg-gray-200">
    <div
      class="page-inner"
      :class="[
        maxWidth === 'sm' && 'page-inner--sm',
        maxWidth === 'md' && 'page-inner--md',
        maxWidth === 'lg' && 'page-inner--lg',
        maxWidth === 'xl' && 'page-inner--xl'  // 👈 NOVO
      ]"
    >
      <slot />
    </div>
  </main>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem; /* cinzento fora do card */
}

.page-inner {
  width: 100%;
}

.page-inner--sm {
  max-width: 480px;
}

.page-inner--md {
  max-width: 640px;
}

.page-inner--lg {
  max-width: 720px;
}

/* 👇 NOVO XL – usa algo mais largo, por exemplo 1100px */
.page-inner--xl {
  max-width: 1100px;
}
</style>
