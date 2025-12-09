<template>
    <div class="border rounded-lg p-3 w-40 flex flex-col items-center gap-2 bg-slate-900" :class="{
        'ring-2 ring-yellow-400': selected,
        'opacity-60': !owned && !isDefault,
    }">
        <img v-if="image" :src="image" alt="" class="w-24 h-32 object-cover rounded-md border border-slate-700"
            @error="onImageError" />

        <div class="font-semibold text-center mt-1 text-white">
            {{ label }}
        </div>

        <div v-if="!isDefault" class="text-sm text-slate-300">{{ price }} coins</div>
        <div v-else class="text-xs text-slate-400">Default</div>

        <div class="mt-2 flex gap-2">
            <button v-if="!owned && !isDefault" class="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-700"
                @click="$emit('buy')">
                Buy
            </button>
            <button v-if="owned" :disabled="selected" @click="!selected && $emit('select')"
                class="px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors" :class="selected
                    ? 'bg-red-500/80 text-white cursor-not-allowed'
                    : 'bg-sky-600 hover:bg-sky-700 text-white'">
                <template v-if="selected">
                    <!-- Check icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Selected
                </template>

                <template v-else>
                    Select
                </template>
            </button>

        </div>
    </div>
</template>

<script setup>
import avatarDefault from '@/assets/images/avatars/anonymous.png'

const props = defineProps({
    label: String,
    price: Number,
    image: String,
    owned: Boolean,
    selected: Boolean,
    isDefault: Boolean,
})

defineEmits(['buy', 'select'])

const onImageError = (event) => {
    event.target.src = avatarDefault
}
</script>
