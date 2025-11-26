<!-- src/components/ui/PageContainer.vue -->
<script setup>
const props = defineProps({
  maxWidth: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})
</script>

<template>
  <main class="page-container">
    <div
      class="page-inner"
      :class="[
        maxWidth === 'sm' && 'page-inner--sm',
        maxWidth === 'md' && 'page-inner--md',
        maxWidth === 'lg' && 'page-inner--lg'
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
  padding: 1.5rem;
  background: #f5f5f5; /* cinzento fora do card */
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
</style>
