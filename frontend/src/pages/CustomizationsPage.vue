<template>
  <div class="max-w-5xl mx-auto p-4 space-y-8">
    <h1 class="text-2xl font-bold mb-4">Customizations</h1>

    <!-- ROW AVATARS -->
    <section>
      <h2 class="text-xl font-semibold mb-2">Avatars</h2>
      <div class="flex flex-wrap gap-4">
        <CustomizationCard
          v-for="avatar in avatars"
          :key="avatar.key"
          :label="avatar.label"
          :price="avatar.price"
          :image="avatar.image"
          :owned="ownedAvatars.includes(avatar.key)"
          :selected="selectedAvatar === avatar.key"
          :is-default="avatar.key === 'default'"
          @buy="() => openBuyConfirm('avatar', avatar)"
          @select="() => handleSelect('avatar', avatar)"
        />
      </div>
    </section>

    <!-- ROW DECKS -->
    <section>
      <h2 class="text-xl font-semibold mb-2">Deck styles</h2>
      <div class="flex flex-wrap gap-4">
        <CustomizationCard
          v-for="deck in decks"
          :key="deck.key"
          :label="deck.label"
          :price="deck.price"
          :image="deck.image"
          :owned="ownedDecks.includes(deck.key)"
          :selected="selectedDeck === deck.key"
          :is-default="deck.key === 'default'"
          @buy="() => openBuyConfirm('deck', deck)"
          @select="() => handleSelect('deck', deck)"
        />
      </div>
    </section>

    <!-- MODAL DE CONFIRMAÇÃO DE COMPRA -->
    <div
      v-if="confirmState.open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div class="bg-slate-900 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700">
        <h3 class="text-lg font-semibold mb-2">Confirm purchase</h3>

        <p class="mb-2">
          Buy
          <span class="font-semibold">
            "{{ confirmState.item?.label }}"
          </span>
          for
          <span class="font-semibold">
            {{ confirmState.item?.price }} coins
          </span>
          ?
        </p>

        <p class="mb-4 text-sm text-slate-300">
          Your current balance:
          <span class="font-mono">
            {{ authStore.currentUser?.coins_balance ?? 0 }}
          </span>
        </p>

        <div class="flex justify-end gap-2">
          <button
            class="px-3 py-1 rounded border border-slate-500 text-slate-100 hover:bg-slate-800"
            @click="closeBuyConfirm"
          >
            Cancel
          </button>
          <button
            class="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
            @click="confirmBuy"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'
import CustomizationCard from '@/components/customization/CustomizationCard.vue'

// 🔹 imports das imagens
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

// 👇 imagem dinâmica do "Profile Pic"
const profilePicImage = computed(() => {
  const user = authStore.currentUser
  if (!user) return avatarDefault

  if (user.photo_avatar_filename) {
    return `http://127.0.0.1:8000/storage/photos_avatars/${user.photo_avatar_filename}`
  }

  return avatarDefault
})

// Definir localmente a lista de itens (mesmas keys do backend)
const avatars = computed(() => [
  { key: 'default', label: 'Profile Pic', price: 0, image: profilePicImage.value },
  { key: 'mage',    label: 'Mage',        price: 20, image: avatarMage },
  { key: 'robot',   label: 'Robot',       price: 30, image: avatarRobot },
  { key: 'dragon',  label: 'Dragon',      price: 40, image: avatarDragon },
])

const decks = [
  { key: 'default',    label: 'Default Deck', price: 0,  image: deckDefault },
  { key: 'wood',       label: 'Wooden Deck',  price: 10, image: deckWood },
  { key: 'arcane',     label: 'Arcane Deck',  price: 25, image: deckArcane },
  { key: 'dark_skull', label: 'Dark Skull',   price: 40, image: deckDarkSkull },
]

const custom = computed(() => authStore.currentUser?.custom ?? {
  avatars: { owned: ['default'], selected: 'default' },
  decks:   { owned: ['default'], selected: 'default' },
})

const ownedAvatars   = computed(() => custom.value.avatars?.owned ?? ['default'])
const selectedAvatar = computed(() => custom.value.avatars?.selected ?? 'default')

const ownedDecks   = computed(() => custom.value.decks?.owned ?? ['default'])
const selectedDeck = computed(() => custom.value.decks?.selected ?? 'default')

// Estado do modal de confirmação
const confirmState = ref({
  open: false,
  type: null,   // 'avatar' | 'deck'
  item: null,   // referência ao objeto avatar/deck
})

const openBuyConfirm = (type, item) => {
  // default não precisa de confirmação → só seleciona
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

  // fecha o modal antes para a UI ficar logo responsiva
  closeBuyConfirm()

  await handleBuy(type, item, { skipConfirm: true })
}

const handleBuy = async (type, item, options = {}) => {
  const { skipConfirm = false } = options

  if (item.price === 0) {
    return handleSelect(type, item)
  }

  // Se não for chamada a partir do modal, só abre o modal e sai
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
