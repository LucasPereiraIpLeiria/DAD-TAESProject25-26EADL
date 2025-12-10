<template>
  <nav class="max-w-full p-5 flex flex-row justify-between align-middle">
    <div class="align-middle text-xl">
      <RouterLink :to="{ name: 'home' }">♠ PlayBisca</RouterLink>
    </div>
    <NavigationMenu>
      <div class="flex items-center text-xl space-x-1" v-if="authStore.isLoggedIn">
        <div>{{ coinBalance }}</div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-coin"
             viewBox="0 0 16 16">
          <path
            d="M5.5 9.511c.076.954.83 1.697 2.182 1.785V12h.6v-.709c1.4-.098 2.218-.846 2.218-1.932 0-.987-.626-1.496-1.745-1.76l-.473-.112V5.57c.6.068.982.396 1.074.85h1.052c-.076-.919-.864-1.638-2.126-1.716V4h-.6v.719c-1.195.117-2.01.836-2.01 1.853 0 .9.606 1.472 1.613 1.707l.397.098v2.034c-.615-.093-1.022-.43-1.114-.9zm2.177-2.166c-.59-.137-.91-.416-.91-.836 0-.47.345-.822.915-.925v1.76h-.005zm.692 1.193c.717.166 1.048.435 1.048.91 0 .542-.412.914-1.135.982V8.518z" />
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
          <path d="M8 13.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11m0 .5A6 6 0 1 0 8 2a6 6 0 0 0 0 12" />
        </svg>
        <AddFunds :current-balance="coinBalance.value" @submit="handleFundsSubmit" />
      </div>

      <NavigationMenuList v-if="authStore.isLoggedIn" class="justify-around gap-20">
        <NavigationMenuItem>
          <NavigationMenuTrigger v-if="authStore.isLoggedIn" class="flex items-center gap-2">
            {{ authStore.currentUser?.nickname ?? authStore.currentUser?.name }}
            <Avatar class="h-8 w-8">
              <AvatarImage :src="effectiveAvatarSrc" @error="onAvatarError" :key="effectiveAvatarSrc" />
            </Avatar>
          </NavigationMenuTrigger>

          <NavigationMenuContent class="w-full md:w-48">
            <li class="flex flex-col w-full text-right">
              <NavigationMenuLink as-child>
                <RouterLink :to="{name: 'profile'}" class="block w-full px-3 py-2">
                  Profile
                </RouterLink>
              </NavigationMenuLink>

              <NavigationMenuLink as-child>
                <RouterLink :to="{ name: 'customizations' }" class="block w-full px-3 py-2">
                  Customizations
                </RouterLink>
              </NavigationMenuLink>

              <NavigationMenuLink as-child>
                <button @click="logout"
                        class="block w-full px-3 py-2 text-right bg-transparent border-none cursor-pointer">
                  Logout
                </button>
              </NavigationMenuLink>
            </li>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>

      <NavigationMenuItem v-if="!authStore.isLoggedIn">
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
import AddFunds from '@/components/ui/AddFunds.vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { inject, ref, watch, computed, onMounted, onUnmounted } from 'vue'
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

// Initialize the router in the monitor store
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

// Watch for login state changes
watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    fetchCoinBalance()
  } else {
    coinBalance.value = 0
  }
}, { immediate: true })

// Novo: reagir a mudanças no currentUser (por ex. depois de refreshUser)
watch(
  () => authStore.currentUser?.coins_balance,
  (newBalance) => {
    if (authStore.isLoggedIn) {
      // se tivermos user logado, reflete o novo saldo
      coinBalance.value = newBalance ?? 0
    }
  }
)

const logout = async () => {
  toast.promise(authStore.logout(), {
    loading: 'Calling API',
    success: () => {
      return 'Logout Successful'
    },
    error: (data) => `[API] Error Logging out- ${data?.response?.data?.message}`,
  })
  // Coin balance will be reset by the watcher
}

const handleFundsSubmit = async (data) => {
  const coins = Math.floor(data.euros * 10)

  toast.promise(apiStore.postCoinPurchase(data, coins), {
    loading: 'Contacting payment processor',
    success: () => {
      return 'Funds added successfully!'
    },
    error: (data) => `[API] Error handling payment method - ${data?.response?.data?.message}`,
  })

  await fetchCoinBalance()
}

// --- AQUI: lógica do avatar mostrado no navbar ---
const avatarSrc = computed(() => {
  const user = authStore.currentUser
  if (!user) return defaultPlaceholder

  const selectedKey = user.custom?.avatars?.selected ?? 'default'

  // Se o user escolheu "default", mostramos a foto que ele fez upload (se existir)
  if (selectedKey === 'default') {
    if (user.photo_avatar_filename) {
      // idealmente isto vinha de uma env/API_BASE_URL_PHOTOS,
      // mas para já mantemos como tens feito:
      return `http://127.0.0.1:8000/storage/photos_avatars/${user.photo_avatar_filename}`
    }

    // Sem foto subida → placeholder
    return defaultPlaceholder
  }

  // Se é um avatar comprado, mapeamos a key para a imagem local
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


// src efetivamente usado no <AvatarImage>
const effectiveAvatarSrc = ref(defaultPlaceholder)

// sempre que avatarSrc mudar, atualizamos o efetivo
watch(avatarSrc, (newVal) => {
  effectiveAvatarSrc.value = newVal || defaultPlaceholder
}, { immediate: true })

// handler para erro de carregamento da imagem
const onAvatarError = () => {
  effectiveAvatarSrc.value = defaultPlaceholder
}

// Global leaderboard polling
let globalPollInterval = null

const startGlobalLeaderboardPolling = () => {
  const allGameModes = [
    { type: 3, mode: 'S', is_match: false },
    { type: 3, mode: 'S', is_match: true },
    { type: 9, mode: 'S', is_match: false },
    { type: 9, mode: 'S', is_match: true },
    { type: 3, mode: 'M', is_match: false },
    { type: 3, mode: 'M', is_match: true },
    { type: 9, mode: 'M', is_match: false },
    { type: 9, mode: 'M', is_match: true },
  ]

  if (globalPollInterval) clearInterval(globalPollInterval)


  // Poll immediately on start
  const pollNow = async () => {
    for (const mode of allGameModes) {
      try {
        const response = await apiStore.getLeaderboard({
          type: mode.type,
          mode: mode.mode,
          is_match: mode.is_match,
        })

        const mappedData = response.data.map(p => ({
          id: p.winner_user_id ?? p.username,
          username: p.username,
          avatar: p.avatar_filename,
          wins: p.total_wins,
          capotes: p.total_capotes,
          bandeiras: p.total_bandeiras,
          points: p.total_points,
          custom: p.custom,
        }))

        leaderboardMonitor.checkForChanges(mode, mappedData)
      } catch (err) {
        console.error('Failed to poll leaderboard:', err)
      }
    }
  }

  // Call immediately
  pollNow()

  // Then set interval
  globalPollInterval = setInterval(pollNow, 30000)
}

onMounted(() => {
  if (authStore.isLoggedIn) {
    startGlobalLeaderboardPolling()
  }
})

// DON'T stop polling when navigating - App.vue stays mounted
// Only stop when app is destroyed, which we can remove or handle differently
// onUnmounted(() => {
//   if (globalPollInterval) clearInterval(globalPollInterval)
// })
</script>

<style scoped>
/* Estilos globais/gerais podem ir aqui mais tarde */
</style>
