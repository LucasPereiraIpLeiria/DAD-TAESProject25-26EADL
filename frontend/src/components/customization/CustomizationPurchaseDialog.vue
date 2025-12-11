<template>
  <Dialog v-model:open="localOpen" @update:open="onUpdateOpen">
    

    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Confirm purchase</DialogTitle>
        <DialogDescription>
          Review this customization before spending your coins.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Summary -->
        <div class="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg">
          <h3 class="font-medium mb-3">Purchase Summary</h3>

          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-slate-300">Item:</span>
              <span class="font-medium">
                {{ item?.label ?? 'Unknown item' }}
              </span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-slate-300">Type:</span>
              <span class="font-medium capitalize">
                {{ type }}
              </span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-slate-300">Price:</span>
              <span class="font-medium">{{ item?.price ?? 0 }} coins</span>
            </div>

            <div class="border-t pt-2 mt-2 flex justify-between">
              <span class="text-gray-600 dark:text-slate-300">Current balance:</span>
              <span class="font-mono">{{ balance }}</span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-slate-300">Balance after purchase:</span>
              <span class="font-mono" :class="balanceAfter < 0 ? 'text-red-500' : 'text-emerald-500'">
                {{ balanceAfter }}
              </span>
            </div>
          </div>
        </div>

        <p class="text-sm text-gray-600 dark:text-slate-300 text-center">
          Are you sure you want to buy this customization?
        </p>

        <!-- Buttons -->
        <div class="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" @click="cancel">
            Cancel
          </Button>
          <Button
            type="button"
            @click="confirm"
            :disabled="balanceAfter < 0 || isSubmitting"
          >
            <span v-if="isSubmitting" class="animate-spin mr-2">⟳</span>
            {{ balanceAfter < 0 ? 'Insufficient funds' : 'Confirm' }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const props = defineProps({
  open: { type: Boolean, default: false },
  type: { type: String, default: '' }, // 'avatar' | 'deck'
  item: { type: Object, default: null }, // { key, label, price, image }
  balance: { type: Number, default: 0 },
})

const emit = defineEmits(['update:open', 'confirm', 'cancel'])

const localOpen = ref(props.open)
const isSubmitting = ref(false)

watch(
  () => props.open,
  (val) => {
    localOpen.value = val
  },
)

const balanceAfter = computed(() => {
  if (!props.item) return props.balance
  return props.balance - (props.item.price ?? 0)
})

const onUpdateOpen = (val) => {
  localOpen.value = val
  emit('update:open', val)
  if (!val) {
    isSubmitting.value = false
  }
}

const cancel = () => {
  emit('cancel')
  emit('update:open', false)
}

const confirm = async () => {
  if (balanceAfter.value < 0) return

  isSubmitting.value = true
  try {
    await emit('confirm') 
    emit('update:open', false)
  } finally {
    isSubmitting.value = false
  }
}
</script>
