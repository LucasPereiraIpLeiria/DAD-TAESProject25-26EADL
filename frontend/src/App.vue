<script setup>
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <nav class="max-w-full p-5 flex flex-row justify-between align-middle">
    <div class="align-middle text-xl">
      <RouterLink :to="{name:'home'}">♠ PlayBisca</RouterLink><!-- TODO: Replace with router link to Home page -->
      <span class="text-xs" v-if="authStore.currentUser">&nbsp;&nbsp;&nbsp;
        ({{ authStore.currentUser?.name }})
      </span>
    </div>

    <NavigationMenu>
      <div class="flex items-center text-xl space-x-1" v-if="authStore.isLoggedIn">
        <div>{{coinBalance}}</div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-coin" viewBox="0 0 16 16">
          <path d="M5.5 9.511c.076.954.83 1.697 2.182 1.785V12h.6v-.709c1.4-.098 2.218-.846 2.218-1.932 0-.987-.626-1.496-1.745-1.76l-.473-.112V5.57c.6.068.982.396 1.074.85h1.052c-.076-.919-.864-1.638-2.126-1.716V4h-.6v.719c-1.195.117-2.01.836-2.01 1.853 0 .9.606 1.472 1.613 1.707l.397.098v2.034c-.615-.093-1.022-.43-1.114-.9zm2.177-2.166c-.59-.137-.91-.416-.91-.836 0-.47.345-.822.915-.925v1.76h-.005zm.692 1.193c.717.166 1.048.435 1.048.91 0 .542-.412.914-1.135.982V8.518z"/>
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
          <path d="M8 13.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11m0 .5A6 6 0 1 0 8 2a6 6 0 0 0 0 12"/>
        </svg>
        <!-- Botão de "novo jogo" que recarrega a rota atual -->
        <RouterLink :to="$route.path">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
          </svg>
        </RouterLink>
      </div>

      <NavigationMenuList class="justify-around gap-20">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Games</NavigationMenuTrigger>
          <NavigationMenuContent>
            <li>
              <NavigationMenuLink as-child>
                <!-- AQUI ligamos ao teu fluxo de singleplayer -->
                <RouterLink :to="{ name: 'singleplayer.mode.select' }">
                  SinglePlayer Game
                </RouterLink>
              </NavigationMenuLink>
              <NavigationMenuLink>
                <!-- Placeholder para multiplayer -->
                <RouterLink :to="$route.path">
                  Multiplayer (coming soon)
                </RouterLink>
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
      <NavigationMenuItem v-else>
        <NavigationMenuLink>
          <a @click.prevent="logout">Logout</a>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenu>
  </nav>

  <div>
    <main>
      <RouterView />
    </main>
  </div>
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
import { RouterLink, RouterView} from 'vue-router';
import { onMounted, inject, ref, watch } from 'vue'
import axios from 'axios'
import {useAuthStore} from '@/stores/auth.js'
import { toast } from 'vue-sonner'

const authStore = useAuthStore()

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

const logout = async () => {
  await toast.promise(authStore.logout(), {
    loading: 'Calling API',
    success: () => {
      return 'Logout Successful'
    },
    error: (data) => `[API] Error saving game - ${data?.response?.data?.message}`,
  })
  // Coin balance will be reset by the watcher
}

onMounted(() => {
  // Initial fetch - will be handled by watcher with immediate: true
})
</script>

<style scoped>
/* Estilos globais/gerais podem ir aqui mais tarde */
</style>
