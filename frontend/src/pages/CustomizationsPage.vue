<template>
  <PageContainer max-width="xl" >
    <div class="w-full bg-white/90 max-w-4xl mx-auto rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
      <h1 class="text-2xl font-bold mb-6 text-center">Customizations</h1>

      <!-- ROW AVATARS -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-3 text-center">Avatars</h2>
        <div class="flex flex-wrap justify-center gap-4">
          <CustomizationCard v-for="avatar in avatars" :key="avatar.key" :label="avatar.label" :price="avatar.price"
            :image="avatar.image" :owned="ownedAvatars.includes(avatar.key)" :selected="selectedAvatar === avatar.key"
            :is-default="avatar.key === 'default'" @buy="() => openBuyConfirm('avatar', avatar)"
            @select="() => handleSelect('avatar', avatar)" />
        </div>
      </section>

      <!-- ROW DECKS -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-3 text-center">Deck styles</h2>
        <div class="flex flex-wrap justify-center gap-4">
          <CustomizationCard v-for="deck in decks" :key="deck.key" :label="deck.label" :price="deck.price"
            :image="deck.image" :owned="ownedDecks.includes(deck.key)" :selected="selectedDeck === deck.key"
            :is-default="deck.key === 'default'" @buy="() => openBuyConfirm('deck', deck)"
            @select="() => handleSelect('deck', deck)" />
        </div>
      </section>

      <div class="flex justify-end">
        <button @click="resetCustomDebug" class="px-3 py-1 text-sm bg-red-700 hover:bg-red-800 rounded text-white mt-2">
          DEBUG: Reset Customizations
        </button>
      </div>

      <CustomizationPurchaseDialog v-model:open="confirmState.open" :type="confirmState.type || ''"
        :item="confirmState.item" :balance="authStore.currentUser?.coins_balance ?? 0" @confirm="confirmBuy"
        @cancel="closeBuyConfirm" />
    </div>
  </PageContainer>
</template>


<script setup>
import PageContainer from '@/components/ui/PageContainer.vue'

import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'
import CustomizationPurchaseDialog from '@/components/customization/CustomizationPurchaseDialog.vue'
import CustomizationCard from '@/components/customization/CustomizationCard.vue'

// Imagens
import avatarDefault from '@/assets/images/avatars/anonymous.png'
import avatarMage from '@/assets/images/avatars/mage.png'
import avatarRobot from '@/assets/images/avatars/robot.png'
import avatarDragon from '@/assets/images/avatars/dragon.png'

import deckDefault from '@/assets/images/decks/default.png'
import deckWood from '@/assets/images/decks/wood.png'
import deckArcane from '@/assets/images/decks/arcane.png'
import deckDarkSkull from '@/assets/images/decks/dark_skull.png'

const authStore = useAuthStore()
const apiStore = useAPIStore()
const router = useRouter()

// Profile Pic dinâmico
const profilePicImage = computed(() => {
  const user = authStore.currentUser
  if (!user) return avatarDefault

  if (user.photo_avatar_filename) {
    return `http://127.0.0.1:8000/storage/photos_avatars/${user.photo_avatar_filename}`
  }

  return avatarDefault
})

const avatars = computed(() => [
  { key: 'default', label: 'Profile Pic', price: 0, image: profilePicImage.value },
  { key: 'mage', label: 'Mage', price: 20, image: avatarMage },
  { key: 'robot', label: 'Robot', price: 30, image: avatarRobot },
  { key: 'dragon', label: 'Dragon', price: 40, image: avatarDragon },
])

const decks = [
  { key: 'default', label: 'Default Deck', price: 0, image: deckDefault },
  { key: 'wood', label: 'Wooden Deck', price: 10, image: deckWood },
  { key: 'arcane', label: 'Arcane Deck', price: 25, image: deckArcane },
  { key: 'dark_skull', label: 'Dark Skull', price: 40, image: deckDarkSkull },
]

const custom = computed(
  () =>
    authStore.currentUser?.custom ?? {
      avatars: { owned: ['default'], selected: 'default' },
      decks: { owned: ['default'], selected: 'default' },
    },
)

const ownedAvatars = computed(() => custom.value.avatars?.owned ?? ['default'])
const selectedAvatar = computed(() => custom.value.avatars?.selected ?? 'default')

const ownedDecks = computed(() => custom.value.decks?.owned ?? ['default'])
const selectedDeck = computed(() => custom.value.decks?.selected ?? 'default')

// Estado do modal
const confirmState = ref({
  open: false,
  type: null, // 'avatar' | 'deck'
  item: null,
})

const openBuyConfirm = (type, item) => {
  if (item.price === 0) {
    handleSelect(type, item)
    return
  }

  confirmState.value = {
    open: true,
    type,
    item,
  }
}

const closeBuyConfirm = () => {
  confirmState.value.open = false
  confirmState.value.type = null
  confirmState.value.item = null
}

const confirmBuy = async () => {
  const { type, item } = confirmState.value
  if (!type || !item) return

  closeBuyConfirm()
  await handleBuy(type, item, { skipConfirm: true })
}

const handleBuy = async (type, item, { skipConfirm = false } = {}) => {
  if (item.price === 0) {
    return handleSelect(type, item)
  }

  if (!skipConfirm) {
    openBuyConfirm(type, item)
    return
  }

  try {
    const res = await apiStore.postPurchaseCustomization({
      type,
      item: item.key,
    })

    const updatedUser = res.data.user
    Object.assign(authStore.currentUser, updatedUser)
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
    Object.assign(authStore.currentUser, updatedUser)
    localStorage.setItem('logged_user', JSON.stringify(updatedUser))

    toast.success('Selection updated!')
  } catch (error) {
    const msg = error.response?.data?.data?.message || 'Error selecting item.'
    toast.error(msg)
  }
}

const resetCustomDebug = async () => {
  try {
    await apiStore.postDebugResetCustomizations()
    await authStore.refreshUser()
    toast.success('Customizations reset (debug)')
  } catch (e) {
    toast.error('Failed to reset customizations.')
    console.error(e)
  }
}

// Se o user fizer logout enquanto está nesta página, manda para a home
watch(
  () => authStore.isLoggedIn,
  (newValue) => {
    console.log('isLoggedIn changed in Customizations page:', newValue)
    if (!newValue) {
      router.push('/')
    }
  },
  { immediate: true },
)
</script>
