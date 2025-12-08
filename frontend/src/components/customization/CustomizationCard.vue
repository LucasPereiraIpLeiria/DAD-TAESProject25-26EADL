<template>
  <div
    class="border rounded-lg p-3 w-40 flex flex-col items-center gap-2 bg-slate-900"
    :class="{
      'ring-2 ring-yellow-400': selected,
      'opacity-60': !owned && !isDefault,
    }"
  >
    <img
      v-if="image"
      :src="image"
      alt=""
      class="w-24 h-32 object-cover rounded-md border border-slate-700"
      @error="$event.target.src = require('@/assets/images/avatars/anonymous.png')"
    />

    <div class="font-semibold text-center mt-1 text-white">
      {{ label }}
    </div>

    <div v-if="!isDefault" class="text-sm text-slate-300">
      {{ price }} coins
    </div>
    <div v-else class="text-xs text-slate-400">
      Default
    </div>

    <div class="mt-2 flex gap-2">
      <button
        v-if="!owned && !isDefault"
        class="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-700"
        @click="$emit('buy')"
      >
        Buy
      </button>
      <button
        v-if="owned"
        class="px-2 py-1 text-xs rounded bg-sky-600 hover:bg-sky-700"
        @click="$emit('select')"
      >
        {{ selected ? 'Selected' : 'Select' }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  label: String,
  price: Number,
  image: String,
  owned: Boolean,
  selected: Boolean,
  isDefault: Boolean,
})

defineEmits(['buy', 'select'])
</script>
