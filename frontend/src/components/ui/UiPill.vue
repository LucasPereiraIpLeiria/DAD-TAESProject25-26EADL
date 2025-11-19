<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'default', // default | subtle | success | danger etc, se quiseres no futuro
  }
})
</script>

<template>
  <span
    class="pill"
    :class="[
      variant === 'subtle' && 'pill--subtle',
      variant === 'success' && 'pill--success',
      variant === 'danger' && 'pill--danger'
    ]"
  >
    <slot />
  </span>
</template>

<style scoped>
.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: #f3f4f6;
  color: #111827;
  font-weight: 500;
  white-space: nowrap;
}

/* exemplos de variantes, caso queiras no futuro */
.pill--subtle {
  background: #e5e7eb;
}

.pill--success {
  background: #dcfce7;
  color: #166534;
}

.pill--danger {
  background: #fee2e2;
  color: #b91c1c;
}
</style>
