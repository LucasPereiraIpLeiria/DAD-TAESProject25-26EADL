<template>
  <div class="max-w-3xl mx-auto p-4 space-y-8">
    <h1 class="text-2xl font-bold mb-4">Customizations</h1>

    <!-- ROW AVATARS -->
    <section>
      <h2 class="text-xl font-semibold mb-2">Avatars</h2>
      <div class="flex gap-4">
        <CustomizationCard
          v-for="avatar in avatars"
          :key="avatar.key"
          :label="avatar.label"
          :price="avatar.price"
          :owned="ownedAvatars.includes(avatar.key)"
          :selected="selectedAvatar === avatar.key"
          :is-default="avatar.key === 'default'"
          @buy="() => handleBuy('avatar', avatar)"
          @select="() => handleSelect('avatar', avatar)"
        />
      </div>
    </section>

    <!-- ROW DECKS -->
    <section>
      <h2 class="text-xl font-semibold mb-2">Deck styles</h2>
      <div class="flex gap-4">
        <CustomizationCard
          v-for="deck in decks"
          :key="deck.key"
          :label="deck.label"
          :price="deck.price"
          :owned="ownedDecks.includes(deck.key)"
          :selected="selectedDeck === deck.key"
          :is-default="deck.key === 'default'"
          @buy="() => handleBuy('deck', deck)"
          @select="() => handleSelect('deck', deck)"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'

// podes fazer um componente CustomizationCard separado, mas para já imagino que existe
// ou depois criamos um. Se não houver, troca por um <div> simples.

const authStore = useAuthStore()
const apiStore = useAPIStore()

// Definir localmente a lista de itens (mesmas keys do backend)
const avatars = [
  { key: 'default', label: 'Default Avatar', price: 0 },
  { key: 'mage',    label: 'Mage',           price: 20 },
  { key: 'robot',   label: 'Robot',          price: 30 },
]

const decks = [
  { key: 'default',    label: 'Default Deck', price: 0 },
  { key: 'wood',       label: 'Wooden Deck',  price: 10 },
  { key: 'arcane',     label: 'Arcane Deck',  price: 25 },
  { key: 'dark_skull', label: 'Dark Skull',   price: 40 },
]

const custom = computed(() => authStore.currentUser?.custom ?? {
  avatars: { owned: ['default'], selected: 'default' },
  decks:   { owned: ['default'], selected: 'default' },
})

const ownedAvatars = computed(() => custom.value.avatars?.owned ?? ['default'])
const selectedAvatar = computed(() => custom.value.avatars?.selected ?? 'default')

const ownedDecks = computed(() => custom.value.decks?.owned ?? ['default'])
const selectedDeck = computed(() => custom.value.decks?.selected ?? 'default')

const handleBuy = async (type, item) => {
  if (item.price === 0) {
    // default: só faz select
    return handleSelect(type, item)
  }

  const confirmMsg =
    `Buy "${item.label}" for ${item.price} coins?\n` +
    `Your current balance: ${authStore.currentUser?.coins_balance ?? 0}`

  if (!window.confirm(confirmMsg)) return

  try {
    const res = await apiStore.postPurchaseCustomization({
      type,
      item: item.key,
    })

    const updatedUser = res.data.user
    authStore.currentUser = updatedUser
    localStorage.setItem('logged_user', JSON.stringify(updatedUser))

    toast.success('Purchase successful!')
  } catch (error) {
    const msg = error.response?.data?.data?.message || 'Error purchasing item.'
    toast.error(msg)
  }
}

const handleSelect = async (type, item) => {
  try {
    const res = await apiStore.patchSelectCustomization({
      type,
      item: item.key,
    })

    const updatedUser = res.data.user
    authStore.currentUser = updatedUser
    localStorage.setItem('logged_user', JSON.stringify(updatedUser))

    toast.success('Selection updated!')
  } catch (error) {
    const msg = error.response?.data?.data?.message || 'Error selecting item.'
    toast.error(msg)
  }
}
</script>
