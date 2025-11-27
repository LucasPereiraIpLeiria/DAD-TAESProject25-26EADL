<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Game modes for the dropdown
const gameModes = [
  { value: 'SCS3', label: 'Singleplayer Competitive Standalone - Bisca of 3' },
  { value: 'SCM3', label: 'Singleplayer Competitive Match - Bisca of 3' },
  { value: 'SCS9', label: 'Singleplayer Competitive Standalone - Bisca of 9' },
  { value: 'SCM9', label: 'Singleplayer Competitive Match - Bisca of 9' },
  { value: 'MS3', label: 'Multiplayer Standalone - Bisca de 3' },
  { value: 'MM3', label: 'Multiplayer Match - Bisca de 3' },
  { value: 'MS9', label: 'Multiplayer Standalone - Bisca de 9' },
  { value: 'MM9', label: 'Multiplayer Match - Bisca de 9' },
]

const selectedGameMode = ref('SCS3')

// Placeholder leaderboard data (will be replaced with API call)
const leaderboardData = ref([])

const handleGameModeChange = (value) => {
  selectedGameMode.value = value
  // TODO: Fetch leaderboard data for selected game mode
  console.log('Selected game mode:', value)
}
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
              Dive into solo matches and improve your skills by playing against AI opponents in practice or competitive modes.
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

      <!-- Third Div Card side by side -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6"> 
        <!-- Left Card - Leaderboards -->
        <Card>
          <CardHeader>
            <CardTitle class="text-2xl">Leaderboards</CardTitle>
            <CardDescription>
              View top players for each game mode
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Game Mode Dropdown -->
            <div class="space-y-2">
              <label class="text-sm font-medium">Select Game Mode</label>
              <Select v-model="selectedGameMode" @update:model-value="handleGameModeChange">
                <SelectTrigger>
                  <SelectValue placeholder="Choose a game mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    v-for="mode in gameModes" 
                    :key="mode.value" 
                    :value="mode.value"
                  >
                    {{ mode.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Leaderboard Display (placeholder) -->
            <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div class="max-h-64 overflow-y-auto">
                <div v-if="leaderboardData.length === 0" class="p-6 text-center text-sm text-muted-foreground">
                  No leaderboard data available yet.
                </div>
                <div v-else class="divide-y">
                  <div v-for="(player, index) in leaderboardData" :key="index"
                    class="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                        :class="{
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300': index === 0,
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300': index === 1,
                          'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300': index === 2,
                          'bg-muted text-muted-foreground': index > 2
                        }">
                        {{ index + 1 }}
                      </div>
                      <div>
                        <div class="font-medium text-sm">{{ player.username }}</div>
                        <div class="text-xs text-muted-foreground">{{ player.score }} points</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Right Card - Match History -->
        <Card>
          <CardHeader>
            <CardTitle class="text-2xl">Match History</CardTitle>
            <CardDescription>
              View your recent matches and performance
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="p-6 text-center text-sm text-muted-foreground">
              No match history available yet.
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  </div>
</template>