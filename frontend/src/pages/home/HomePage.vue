<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

import defaultPlaceholder from '@/assets/images/avatars/anonymous.png'
import avatarMage from '@/assets/images/avatars/mage.png'
import avatarRobot from '@/assets/images/avatars/robot.png'
import avatarDragon from '@/assets/images/avatars/dragon.png'

const auth = useAuthStore()
const apiStore = useAPIStore()

const personalStats = ref(null)
const globalScoreboards = ref({
  top_matches: [],
  top_achievements: [],
  top_coins: [],
})

// avatar helper (igual ao do History antigo, mas aqui só para global scoreboards)
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
    const response = await apiStore.getUserStats()
    personalStats.value = response.data
  } catch (err) {
    console.error('Failed to load personal stats', err)
    personalStats.value = null
  }
}

async function loadGlobalScoreboards() {
  try {
    const response = await apiStore.getGlobalScoreboards()
    globalScoreboards.value = response.data
  } catch (err) {
    console.error('Failed to load global scoreboards', err)
    globalScoreboards.value = {
      top_matches: [],
      top_achievements: [],
      top_coins: [],
    }
  }
}

onMounted(() => {
  loadGlobalScoreboards()
  loadPersonalStats()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto space-y-6">

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

        <!-- Left Card -->
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

        <!-- Right Card -->
        <Card>
          <CardHeader>
            <CardTitle class="text-2xl">Multiplayer</CardTitle>
            <CardDescription>
              Join multiplayer matches, compete with other players, and climb the leaderboards. Multiplayer mode is coming soon!
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <RouterLink :to="{ name: 'singleplayer.mode.select' }">
              <Button class="w-full" variant="default">
                Multiplayer Mode Selection
              </Button>
            </RouterLink>
          </CardContent>
        </Card>
      </div>

      <!-- Scoreboards (full width, dividido em 2 colunas) -->
      <Card>
        <CardHeader>
          <CardTitle class="text-2xl">Scoreboards</CardTitle>
          <CardDescription>
            Check your personal performance and see how you compare globally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Personal bests -->
            <div class="border rounded-lg p-4 bg-white">
              <h2 class="text-lg font-semibold mb-2">Personal Bests</h2>
              <p class="text-xs text-gray-500 mb-3">
                Your overall performance in matches.
              </p>

              <div v-if="personalStats" class="grid grid-cols-2 gap-3 text-sm">
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Matches</span>
                  <span class="font-semibold">{{ personalStats.total_matches }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Wins</span>
                  <span class="font-semibold text-green-700">{{ personalStats.wins }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Losses</span>
                  <span class="font-semibold text-red-700">{{ personalStats.losses }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Draws</span>
                  <span class="font-semibold text-gray-700">{{ personalStats.draws }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Win rate</span>
                  <span class="font-semibold">
                    {{ personalStats.win_rate }}%
                  </span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Capotes</span>
                  <span class="font-semibold">{{ personalStats.total_capotes }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Bandeiras</span>
                  <span class="font-semibold">{{ personalStats.total_bandeiras }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Coins earned (theoretical)</span>
                  <span class="font-semibold text-yellow-700">
                    {{ personalStats.coins_earned }}
                  </span>
                </div>
              </div>

              <p
                v-else
                class="text-xs text-gray-500"
              >
                {{ auth.isLoggedIn ? 'No match data yet.' : 'Log in to see your personal stats.' }}
              </p>
            </div>

            <!-- Global Scoreboards -->
            <div class="border rounded-lg p-4 bg-white">
              <h2 class="text-lg font-semibold mb-2">Global Rankings</h2>
              <p class="text-xs text-gray-500 mb-3">
                Rankings across all registered players.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <!-- Most matches won -->
                <div>
                  <h3 class="font-semibold mb-1">Most matches won</h3>
                  <ul class="space-y-1">
                    <li
                      v-for="(p, idx) in globalScoreboards.top_matches"
                      :key="'tm-'+p.user_id"
                      class="flex items-center gap-2"
                    >
                      <span class="w-4 text-right mr-1">{{ idx + 1 }}.</span>
                      <Avatar class="h-6 w-6">
                        <AvatarImage :src="getEffectiveAvatar(p)" />
                        <AvatarFallback>
                          <img
                            :src="defaultPlaceholder"
                            alt=""
                            class="h-6 w-6 rounded-full"
                          >
                        </AvatarFallback>
                      </Avatar>
                      <span class="truncate">{{ p.username }}</span>
                      <span class="ml-auto font-semibold">{{ p.total_wins }}</span>
                    </li>
                    <li v-if="!globalScoreboards.top_matches?.length" class="text-gray-400">
                      No data.
                    </li>
                  </ul>
                </div>

                <!-- Most achievements -->
                <div>
                  <h3 class="font-semibold mb-1">Most achievements</h3>
                  <ul class="space-y-1">
                    <li
                      v-for="(p, idx) in globalScoreboards.top_achievements"
                      :key="'ta-'+p.user_id"
                      class="flex items-center gap-2"
                    >
                      <span class="w-4 text-right mr-1">{{ idx + 1 }}.</span>
                      <Avatar class="h-6 w-6">
                        <AvatarImage :src="getEffectiveAvatar(p)" />
                        <AvatarFallback>
                          <img
                            :src="defaultPlaceholder"
                            alt=""
                            class="h-6 w-6 rounded-full"
                          >
                        </AvatarFallback>
                      </Avatar>
                      <span class="truncate">{{ p.username }}</span>
                      <span class="ml-auto font-semibold">
                        {{ p.total_achievements ?? (p.total_capotes + p.total_bandeiras) }}
                      </span>
                    </li>
                    <li v-if="!globalScoreboards.top_achievements?.length" class="text-gray-400">
                      No data.
                    </li>
                  </ul>
                </div>

                <!-- Most coins -->
                <div>
                  <h3 class="font-semibold mb-1">Most coins (theoretical)</h3>
                  <ul class="space-y-1">
                    <li
                      v-for="(p, idx) in globalScoreboards.top_coins"
                      :key="'tc-'+p.user_id"
                      class="flex items-center gap-2"
                    >
                      <span class="w-4 text-right mr-1">{{ idx + 1 }}.</span>
                      <Avatar class="h-6 w-6">
                        <AvatarImage :src="getEffectiveAvatar(p)" />
                        <AvatarFallback>
                          <img
                            :src="defaultPlaceholder"
                            alt=""
                            class="h-6 w-6 rounded-full"
                          >
                        </AvatarFallback>
                      </Avatar>
                      <span class="truncate">{{ p.username }}</span>
                      <span class="ml-auto font-semibold text-yellow-700">
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
    </div>
  </div>
</template>
