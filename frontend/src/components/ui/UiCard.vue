<!-- src/components/ui/UiCard.vue -->
<script setup>
const props = defineProps({
  padding: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  }
})
</script>

<template>
  <section class="ui-card" :class="`ui-card--${padding}`">
    <slot />
  </section>
</template>

<style scoped>
.ui-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12);
  border: 1px solid #e5e7eb;
}

.ui-card--sm {
  padding: 1rem 1.25rem;
}

.ui-card--md {
  padding: 1.75rem 2rem;
}

.ui-card--lg {
  padding: 2.25rem 2.5rem;
}
</style>
