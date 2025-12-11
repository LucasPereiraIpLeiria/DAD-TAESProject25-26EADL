<script setup>
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useLeaderboardMonitor } from '@/stores/leaderboardMonitor'
import { useRoute, useRouter } from 'vue-router'


import defaultPlaceholder from '@/assets/images/avatars/anonymous.png'
import avatarMage from '@/assets/images/avatars/mage.png'
import avatarRobot from '@/assets/images/avatars/robot.png'
import avatarDragon from '@/assets/images/avatars/dragon.png'

const auth = useAuthStore()
const apiStore = useAPIStore()
const leaderboardMonitor = useLeaderboardMonitor()

const personalStats = ref(null)
const globalScoreboards = ref({
  top_matches: [],
  top_achievements: [],
  top_coins: [],
})

const route = useRoute()
const router = useRouter()
// Variant toggle (3 / 9), default 9
const variant = ref('9')

// avatar helper 
function getEffectiveAvatar(player) {
  try {
    const custom = typeof player.custom === 'string'
      ? JSON.parse(player.custom)
      : player.custom

    const selectedKey = custom?.avatars?.selected ?? 'default'

    if (selectedKey === 'default') {
      if (player.avatar_filename) {
        return apiStore.photoAvatarStorageURL + player.avatar_filename
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
  } catch (e) {
    console.error('Error resolving avatar', e)
    return defaultPlaceholder
  }
}

async function loadPersonalStats() {
  if (!auth.isLoggedIn) {
    personalStats.value = null
    return
  }

  try {
    const response = await apiStore.getUserStats({ type: variant.value })
    personalStats.value = response.data
  } catch (err) {
    console.error('Failed to load personal stats', err)
    personalStats.value = null
  }
}

async function loadGlobalScoreboards() {
  if (!auth.isLoggedIn) {
    globalScoreboards.value = {
      top_matches: [],
      top_achievements: [],
      top_coins: [],
    }
    return
  }

  try {
    const response = await apiStore.getGlobalScoreboards({ type: variant.value })
    globalScoreboards.value = response.data

    // Monitor: verifica alterações de líder para esta variante
    leaderboardMonitor.checkForChanges(response.data, variant.value)
  } catch (err) {
    console.error('Failed to load global scoreboards', err)
    globalScoreboards.value = {
      top_matches: [],
      top_achievements: [],
      top_coins: [],
    }
  }
}

function setVariant(v) {
  if (variant.value === v) return
  variant.value = v

  router.replace({
    name: 'home',
    query: {
      ...route.query,
      variant: v,
    },
  })
}

// Quando muda a variante, recarregar stats e scoreboards (se estiver logado)
watch(variant, () => {
  if (!auth.isLoggedIn) return
  loadGlobalScoreboards()
  loadPersonalStats()
})

// Se o estado de login mudar (ex: login/logout sem recarregar a página)
watch(
  () => auth.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      loadGlobalScoreboards()
      loadPersonalStats()
    } else {
      personalStats.value = null
      globalScoreboards.value = {
        top_matches: [],
        top_achievements: [],
        top_coins: [],
      }
    }
  },
)

watch(
  () => route.query.variant,
  (newVariant) => {
    if (newVariant === '3' || newVariant === '9') {
      variant.value = newVariant
    }
  },
)

onMounted(() => {
  const qVariant = route.query.variant
  if (qVariant === '3' || qVariant === '9') {
    variant.value = qVariant
  }

  if (auth.isLoggedIn) {
    loadGlobalScoreboards()
    loadPersonalStats()
  }
})
</script>

<template>
  <div class="min-h-screen p-6 ">
    <div class="max-w-7xl mx-auto space-y-6 ">

      <!-- Top Block - Full Width -->
      <Card>
        <CardHeader>
          <CardTitle class="text-3xl font-bold">
            Welcome to PlayBisca
          </CardTitle>
          <CardDescription class="text-lg">
            Play the popular portuguese card game Bisca in singleplayer or multiplayer modes!
          </CardDescription>
        </CardHeader>
      </Card>

      <!-- Second Div Card side by side -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- Left Card - Singleplayer -->
        <Card>
          <CardHeader>
            <CardTitle class="text-2xl">Singleplayer</CardTitle>
            <CardDescription>
              Dive into solo matches and improve your skills by playing against AI opponents in practice or match modes.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <RouterLink :to="{ name: 'singleplayer.mode.select' }">
              <Button class="w-full" variant="default">
                Singleplayer Mode Selection
              </Button>
            </RouterLink>
          </CardContent>
        </Card>

        <!-- Right Card - Multiplayer (visível mas desativado se não logado) -->
        <Card :class="!auth.isLoggedIn ? 'opacity-60' : ''">
          <CardHeader>
            <CardTitle class="text-2xl">Multiplayer</CardTitle>
            <CardDescription>
              Join multiplayer matches, compete with other players, and climb the leaderboards.
              Multiplayer mode is coming soon!
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button class="w-full" variant="default" :disabled="!auth.isLoggedIn"
              :class="!auth.isLoggedIn ? 'cursor-not-allowed' : ''">
              Multiplayer: Coming Soon
              <span v-if="!auth.isLoggedIn" class="ml-2 text-xs">
                (login required)
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Scoreboards (apenas se estiver autenticado) -->
      <Card v-if="auth.isLoggedIn">
        <CardHeader class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle class="text-2xl">Scoreboards</CardTitle>
            <CardDescription>
              Check your personal performance and see how you compare globally.
            </CardDescription>
          </div>

          <!-- Variant Toggle -->
          <div class="flex items-center gap-3 text-sm">
            <span class="font-medium text-gray-800 text-sm">Variant:</span>

            <button type="button" class="px-3 py-1.5 rounded border text-sm font-medium cursor-pointer transition-colors
           hover:bg-indigo-100 hover:border-indigo-300" :class="variant === '9'
            ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
            : 'bg-white text-gray-700 border-gray-300'" @click="setVariant('9')">
              Bisca of 9
            </button>

            <button type="button" class="px-3 py-1.5 rounded border text-sm font-medium cursor-pointer transition-colors
           hover:bg-indigo-100 hover:border-indigo-300" :class="variant === '3'
            ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
            : 'bg-white text-gray-700 border-gray-300'" @click="setVariant('3')">
              Bisca of 3
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <!-- Personal bests -->
            <div class="border rounded-lg p-4 bg-white">
              <h2 class="text-lg font-semibold mb-2">Personal Bests</h2>

              <p class="text-xs text-gray-500 mb-3">
                Your overall performance in matches ({{ variant === '9' ? 'Bisca of 9' : 'Bisca of 3' }}).
              </p>

              <div v-if="personalStats" class="grid grid-cols-2 gap-3 text-base">

                <div class="flex flex-col bg-gray-100 p-2 rounded-lg items-center text-center leading-tight">
                  <span class="text-sm text-gray-600">Matches</span>
                  <span class="font-bold text-lg">{{ personalStats.total_matches }}</span>
                </div>

                <div class="flex flex-col bg-gray-100 p-2 rounded-lg items-center text-center leading-tight">
                  <span class="text-sm text-gray-600">Draws</span>
                  <span class="font-bold text-gray-700 text-lg">{{ personalStats.draws }}</span>
                </div>

                <div class="flex flex-col bg-gray-100 p-2 rounded-lg items-center text-center leading-tight">
                  <span class="text-sm text-gray-600">Wins</span>
                  <span class="font-bold text-green-700 text-lg">{{ personalStats.wins }}</span>
                </div>

                <div class="flex flex-col bg-gray-100 p-2 rounded-lg items-center text-center leading-tight">
                  <span class="text-sm text-gray-600">Losses</span>
                  <span class="font-bold text-red-700 text-lg">{{ personalStats.losses }}</span>
                </div>

                <div class="flex flex-col bg-gray-100 p-2 rounded-lg items-center text-center leading-tight">
                  <span class="text-sm text-gray-600">Win rate</span>
                  <span class="font-bold text-lg">{{ personalStats.win_rate }}%</span>
                </div>

                <div class="flex flex-col bg-gray-100 p-2 rounded-lg items-center text-center leading-tight">
                  <span class="text-sm text-gray-600">Capotes</span>
                  <span class="font-bold text-lg">{{ personalStats.total_capotes }}</span>
                </div>

                <div class="flex flex-col bg-gray-100 p-2 rounded-lg items-center text-center leading-tight">
                  <span class="text-sm text-gray-600">Bandeiras</span>
                  <span class="font-bold text-lg">{{ personalStats.total_bandeiras }}</span>
                </div>

                <div class="flex flex-col bg-gray-100 p-2 rounded-lg items-center text-center leading-tight">
                  <span class="text-sm text-gray-600">Coins earned</span>
                  <span class="font-bold text-lg text-yellow-700">
                    {{ personalStats.coins_earned }}
                  </span>
                </div>

              </div>

              <p v-else class="text-xs text-gray-500">
                No match data yet.
              </p>
            </div>

            <!-- Global Scoreboards -->
            <div class="border rounded-lg p-4 bg-white">
              <h2 class="text-lg font-semibold mb-2">Global Rankings</h2>
              <p class="text-xs text-gray-500 mb-3">
                Rankings across all registered players ({{ variant === '9' ? 'Bisca of 9' : 'Bisca of 3' }}).
              </p>

              
              <div class="grid grid-cols-1 md:grid-cols-3 text-xs md:divide-x md:divide-gray-200">
                <!-- Most matches won -->
                <div class="md:pr-4 mb-3 md:mb-0">
                  <h3 class="font-semibold mb-1">Most matches won</h3>
                  <ul class="space-y-1">
                    <li v-for="(p, idx) in globalScoreboards.top_matches" :key="'tm-' + p.user_id"
                      class="flex items-center gap-2">
                      <span class="w-4 text-right mr-1">{{ idx + 1 }}.</span>
                      <Avatar class="h-6 w-6">
                        <AvatarImage :src="getEffectiveAvatar(p)" />
                        <AvatarFallback>
                          <img :src="defaultPlaceholder" alt="" class="h-6 w-6 rounded-full" />
                        </AvatarFallback>
                      </Avatar>
                      <span class="truncate">{{ p.username }}</span>
                      <span class="ml-auto font-semibold pr-1">{{ p.total_wins }}</span>
                    </li>
                    <li v-if="!globalScoreboards.top_matches?.length" class="text-gray-400">
                      No data.
                    </li>
                  </ul>
                </div>

                <!-- Most achievements -->
                <div class="md:px-4 mb-3 md:mb-0">
                  <h3 class="font-semibold mb-1">Most achievements</h3>
                  <ul class="space-y-1">
                    <li v-for="(p, idx) in globalScoreboards.top_achievements" :key="'ta-' + p.user_id"
                      class="flex items-center gap-2">
                      <span class="w-4 text-right mr-1">{{ idx + 1 }}.</span>
                      <Avatar class="h-6 w-6">
                        <AvatarImage :src="getEffectiveAvatar(p)" />
                        <AvatarFallback>
                          <img :src="defaultPlaceholder" alt="" class="h-6 w-6 rounded-full" />
                        </AvatarFallback>
                      </Avatar>
                      <span class="truncate">{{ p.username }}</span>
                      <span class="ml-auto font-semibold pr-1">
                        {{ p.total_achievements ?? (p.total_capotes + p.total_bandeiras) }}
                      </span>
                    </li>
                    <li v-if="!globalScoreboards.top_achievements?.length" class="text-gray-400">
                      No data.
                    </li>
                  </ul>
                </div>

                <!-- Most coins -->
                <div class="md:pl-4">
                  <h3 class="font-semibold mb-1">Most coins</h3>
                  <ul class="space-y-1">
                    <li v-for="(p, idx) in globalScoreboards.top_coins" :key="'tc-' + p.user_id"
                      class="flex items-center gap-2">
                      <span class="w-4 text-right mr-1">{{ idx + 1 }}.</span>
                      <Avatar class="h-6 w-6">
                        <AvatarImage :src="getEffectiveAvatar(p)" />
                        <AvatarFallback>
                          <img :src="defaultPlaceholder" alt="" class="h-6 w-6 rounded-full" />
                        </AvatarFallback>
                      </Avatar>
                      <span class="truncate">{{ p.username }}</span>
                      <span class="ml-auto font-semibold text-yellow-700 pr-1">
                        {{ p.total_coins }}
                      </span>
                    </li>
                    <li v-if="!globalScoreboards.top_coins?.length" class="text-gray-400">
                      No data.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      <!-- Mensagem para guests -->
      <Card v-else>
        <CardHeader>
          <CardTitle class="text-xl">Scoreboards</CardTitle>
          <CardDescription>
            Log in to see your personal stats and global rankings.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  </div>
</template>
