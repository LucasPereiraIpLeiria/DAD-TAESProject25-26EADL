<script setup>
const props = defineProps({
  label: {
    type: String,
    required: true
  },
  valueClass: {
    type: [String, Array, Object],
    default: ''
  }
})
</script>

<template>
  <div class="info-block">
    <p class="info-label">{{ label }}</p>
    <p class="info-value" :class="valueClass">
      <slot />
    </p>
  </div>
</template>

<style scoped>
.info-block {
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.info-label {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
}

.info-value {
  margin: 0.1rem 0 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: #111827;
}
</style>
