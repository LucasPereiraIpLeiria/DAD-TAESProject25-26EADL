<template>
  <nav class="max-w-full p-5 flex flex-row justify-between align-middle">
    <div class="align-middle text-3xl font-bold text-slate-900">
      <RouterLink :to="{ name: 'home' }">♠ PlayBisca</RouterLink>
    </div>

    
    <NavigationMenu class="flex items-center gap-6">
      <!-- BLOCO COINS -->
      <div v-if="authStore.isLoggedIn" class="flex items-center text-sm">
        <!-- Pill com saldo + ícone + botão + -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-yellow-300 shadow-sm">
          <span class="font-semibold text-base">
            {{ coinBalance }}
          </span>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            class="bi bi-coin"
            viewBox="0 0 16 16"
          >
            <path
              d="M5.5 9.511c.76.954 1.83 1.697 3.182 1.785V12h.6v-.709c1.4-.098 2.218-.846 2.218-1.932 0-.987-.626-1.496-1.745-1.76l-.473-.112V5.57c.6.068.982.396 1.074.85h1.052c-.076-.919-.864-1.638-2.126-1.716V4h-.6v.719c-1.195.117-2.01.836-2.01 1.853 0 .9.606 1.472 1.613 1.707l.397.098v2.034c-1.015-.093-1.722-.43-2.114-.9z"
            />
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
            <path
              d="M8 13.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11m0 .5A6 6 0 1 0 8 2a6 6 0 0 0 0 12"
            />
          </svg>

          
          <AddFunds
            :current-balance="coinBalance.value"
            @submit="handleFundsSubmit"
            class="flex items-center justify-center w-7 h-7 rounded-full
                   bg-yellow-400 text-slate-900 text-base font-bold
                   hover:bg-yellow-300 focus:outline-none
                   focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2
                   transition"
          >
            +
          </AddFunds>
        </div>
      </div>

      <!-- MENU USER / AVATAR -->
      <NavigationMenuList v-if="authStore.isLoggedIn">
        <NavigationMenuItem>
          <NavigationMenuTrigger class="flex items-center gap-2">
            {{ authStore.currentUser?.nickname ?? authStore.currentUser?.name }}
            <Avatar class="h-12 w-12">
              <AvatarImage :src="effectiveAvatarSrc" @error="onAvatarError" :key="effectiveAvatarSrc" />
            </Avatar>
          </NavigationMenuTrigger>

          <NavigationMenuContent class="w-full md:w-48">
            <li class="flex flex-col w-full text-right">
              <NavigationMenuLink as-child>
                <RouterLink :to="{ name: 'profile' }" class="block w-full px-3 py-2">
                  Profile
                </RouterLink>
              </NavigationMenuLink>

              <NavigationMenuLink as-child>
                <RouterLink :to="{ name: 'customizations' }" class="block w-full px-3 py-2">
                  Customizations
                </RouterLink>
              </NavigationMenuLink>

              <NavigationMenuLink as-child>
                <RouterLink :to="{ name: 'history' }" class="block w-full px-3 py-2">
                  Game History
                </RouterLink>
              </NavigationMenuLink>

              <NavigationMenuLink as-child>
                <button
                  @click="logout"
                  class="block w-full px-3 py-2 text-right bg-transparent border-none cursor-pointer"
                >
                  Logout
                </button>
              </NavigationMenuLink>
            </li>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>

      <NavigationMenuItem v-else>
        <NavigationMenuLink>
          <RouterLink to="/login">Login</RouterLink>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenu>
  </nav>

  <div>
    <main>
      <RouterView />
    </main>
  </div>

  <Toaster position="bottom-right" />
</template>

<script setup>
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import AddFunds from '@/components/ui/AddFunds.vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { inject, ref, watch, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.js'
import { toast, Toaster } from 'vue-sonner'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { useAPIStore } from '@/stores/api.js'
import { useLeaderboardMonitor } from '@/stores/leaderboardMonitor'

import defaultPlaceholder from '@/assets/images/avatars/anonymous.png'
import avatarMage from '@/assets/images/avatars/mage.png'
import avatarRobot from '@/assets/images/avatars/robot.png'
import avatarDragon from '@/assets/images/avatars/dragon.png'

const authStore = useAuthStore()
const apiStore = useAPIStore()


const leaderboardMonitor = useLeaderboardMonitor()
const appRouter = useRouter()
leaderboardMonitor.setRouter(appRouter)

const API_BASE_URL = inject('apiBaseURL')
const coinBalance = ref(0)

const fetchCoinBalance = async () => {
  if (!authStore.isLoggedIn) {
    coinBalance.value = 0
    return
  }

  try {
    const coinRequest = await axios.get(`${API_BASE_URL}/users/me`)
    if (coinRequest.status === 200) {
      const coinData = coinRequest.data
      coinBalance.value = coinData.coins_balance
    } else {
      coinBalance.value = 0
    }
  } catch (error) {
    console.error('Failed to fetch coin balance:', error)
    coinBalance.value = 0
  }
}

watch(
  () => authStore.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      fetchCoinBalance()
    } else {
      coinBalance.value = 0
    }
  },
  { immediate: true },
)

watch(
  () => authStore.currentUser?.coins_balance,
  (newBalance) => {
    if (authStore.isLoggedIn) {
      coinBalance.value = newBalance ?? 0
    }
  },
)

const logout = async () => {
  toast.promise(authStore.logout(), {
    loading: 'Calling API',
    success: () => 'Logout Successful',
    error: (data) => `[API] Error Logging out - ${data?.response?.data?.message}`,
  })
}

const handleFundsSubmit = async (data) => {
  const coins = Math.floor(data.euros * 10)

  toast.promise(apiStore.postCoinPurchase(data, coins), {
    loading: 'Contacting payment processor',
    success: () => 'Funds added successfully!',
    error: (data) => `[API] Error handling payment method - ${data?.response?.data?.message}`,
  })

  await fetchCoinBalance()
}

// Avatar mostrado no navbar
const avatarSrc = computed(() => {
  const user = authStore.currentUser
  if (!user) return defaultPlaceholder

  const selectedKey = user.custom?.avatars?.selected ?? 'default'

  if (selectedKey === 'default') {
    if (user.photo_avatar_filename) {
      return `http://127.0.0.1:8000/storage/photos_avatars/${user.photo_avatar_filename}`
    }
    return defaultPlaceholder
  }

  switch (selectedKey) {
    case 'mage':
      return avatarMage
    case 'robot':
      return avatarRobot
    case 'dragon':
      return avatarDragon
    default:
      return defaultPlaceholder
  }
})

const effectiveAvatarSrc = ref(defaultPlaceholder)

watch(
  avatarSrc,
  (newVal) => {
    effectiveAvatarSrc.value = newVal || defaultPlaceholder
  },
  { immediate: true },
)

const onAvatarError = () => {
  effectiveAvatarSrc.value = defaultPlaceholder
}
</script>

<style scoped>

</style>
