<!-- src/components/ui/UiOptionTile.vue -->
<script setup>
const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

function handleClick() {
  emit('click')
}
</script>

<template>
  <button
    type="button"
    class="option-tile"
    :class="{ 'option-tile--active': active }"
    @click="handleClick"
  >
    <span class="option-title">
      <slot name="title" />
    </span>

    <span class="option-desc">
      <slot name="description" />
    </span>
  </button>
</template>

<style scoped>
.option-tile {
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

.option-tile:hover {
  transform: translateY(-1px);
  border-color: #d1d5db;
}

.option-tile--active {
  background: #111827;
  border-color: #111827;
  color: #f9fafb;
}

.option-title {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
}

.option-desc {
  display: block;
  font-size: 0.75rem;
  opacity: 0.8;
}
</style>
