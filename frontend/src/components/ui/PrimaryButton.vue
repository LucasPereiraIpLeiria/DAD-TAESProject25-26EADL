<script setup>
const props = defineProps({
  as: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

function onClick(event) {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<template>
  <component
    :is="as"
    class="primary-btn"
    :disabled="as === 'button' ? disabled : undefined"
    @click="onClick"
  >
    <slot />
  </component>
</template>

<style scoped>
.primary-btn {
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

.primary-btn:hover {
  background: #0f172a;
  transform: translateY(-1px);
}

.primary-btn:disabled,
.primary-btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>
