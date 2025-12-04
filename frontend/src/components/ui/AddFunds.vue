<template>
  <Dialog v-model:open="open" @update:open="handleDialogClose">
    <DialogTrigger as-child>
      <div
        @click="open = true"
        class="cursor-pointer inline-block p-1"
        title="Add funds"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
        </svg>
      </div>
    </DialogTrigger>

    <DialogContent class="sm:max-w-md" @interact-outside="resetForm">
      <DialogHeader>
        <DialogTitle>
          {{ showConfirmation ? 'Confirm Purchase' : 'Add Funds' }}
        </DialogTitle>
        <DialogDescription>
          {{ showConfirmation ? 'Review and confirm your purchase details' : 'Enter your payment details to add funds' }}
        </DialogDescription>
      </DialogHeader>

      <!-- Main Form (shown first) -->
      <div v-if="!showConfirmation">
        <form @submit.prevent="handleProceed" class="space-y-4">
          <!-- Amount -->
          <div class="space-y-2">
            <Label for="amount">Amount (€)</Label>
            <Input
              id="amount"
              v-model="formData.euros"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
            />
          </div>

          <!-- Payment Type -->
          <div class="space-y-2">
            <Label for="paymentType">Payment Method</Label>
            <select
              id="paymentType"
              v-model="formData.paymentType"
              class="w-full p-2 border rounded-md"
              required
              @change="formData.paymentReference = ''"
            >
              <option value="">Select method</option>
              <option value="MBWAY">MBWAY</option>
              <option value="IBAN">IBAN</option>
              <option value="MB">Multibanco</option>
              <option value="VISA">VISA</option>
              <option value="PAYPAL">PayPal</option>
            </select>
          </div>

          <!-- Payment Reference -->
          <div v-if="formData.paymentType" class="space-y-2">
            <Label for="reference">Payment Reference</Label>
            <Input
              id="reference"
              v-model="formData.paymentReference"
              :placeholder="getReferencePlaceholder()"
              required
            />
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 pt-4">
            <DialogClose as-child>
              <Button type="button" variant="outline" @click="resetForm">Cancel</Button>
            </DialogClose>
            <Button type="submit">Proceed</Button>
          </div>
        </form>
      </div>

      <!-- Confirmation Step (shown after clicking Proceed) -->
      <div v-else class="space-y-4">
        <!-- Purchase Summary -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="font-medium mb-3">Purchase Summary</h3>

          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Amount:</span>
              <span class="font-medium">{{ formData.euros }} €</span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-600">Payment Method:</span>
              <span class="font-medium">{{ getPaymentMethodName(formData.paymentType) }}</span>
            </div>

            <div v-if="formData.paymentReference" class="flex justify-between">
              <span class="text-gray-600">Reference:</span>
              <span class="font-mono text-sm">{{ formData.paymentReference }}</span>
            </div>

            <div class="border-t pt-2 mt-2">
              <div class="flex justify-between">
                <span class="font-medium">Coins to receive:</span>
                <span class="font-bold text-green-600">{{ calculatedCoins }} coins</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Confirmation Text -->
        <p class="text-center text-gray-600">
          Are you sure you want to proceed with this purchase?
        </p>

        <!-- Confirmation Buttons -->
        <div class="flex justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            @click="showConfirmation = false"
            class="flex-1"
          >
            Go Back
          </Button>
          <Button
            type="button"
            @click="handleConfirm"
            class="flex-1"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="animate-spin mr-2">⟳</span>
            Confirm Purchase
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const open = ref(false)
const showConfirmation = ref(false)
const isSubmitting = ref(false)
const formData = ref({
  euros: '',
  paymentType: '',
  paymentReference: ''
})

const emit = defineEmits(['submit'])

// Watch for dialog close
watch(open, (newValue) => {
  if (!newValue) {
    // Dialog closed - reset everything
    resetForm()
  }
})

// Calculate coins (assuming 1 euro = 100 coins)
const calculatedCoins = computed(() => {
  if (!formData.value.euros) return 0
  return Math.floor(parseFloat(formData.value.euros) * 10)
})

const getReferencePlaceholder = () => {
  const placeholders = {
    MBWAY: '912345678',
    IBAN: 'PT50123456781234567812349',
    MB: '12345-123456789',
    VISA: '4123456789123456',
    PAYPAL: 'your@email.com'
  }
  return placeholders[formData.value.paymentType] || 'Enter reference'
}

const getPaymentMethodName = (method) => {
  const names = {
    MBWAY: 'MBWAY',
    IBAN: 'IBAN',
    MB: 'Multibanco',
    VISA: 'VISA',
    PAYPAL: 'PayPal'
  }
  return names[method] || method
}

const handleProceed = () => {
  // Validate form before proceeding
  if (!formData.value.euros || !formData.value.paymentType || !formData.value.paymentReference) {
    return
  }

  // Show confirmation step
  showConfirmation.value = true
}

const handleConfirm = async () => {
  isSubmitting.value = true

  try {
    const purchaseData = {
      euros: parseFloat(formData.value.euros),
      payment_type: formData.value.paymentType,
      payment_reference: formData.value.paymentReference,
      coins: calculatedCoins.value
    }

    // Emit to parent
    emit('submit', purchaseData)

    // Reset and close
    resetForm()
    open.value = false

  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  formData.value = {
    euros: '',
    paymentType: '',
    paymentReference: ''
  }
  showConfirmation.value = false
  isSubmitting.value = false
}

// Handle when dialog closes via X or outside click
const handleDialogClose = (value) => {
  open.value = value
  if (!value) {
    resetForm()
  }
}
</script>
