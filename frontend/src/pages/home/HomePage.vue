<script setup>
import { ref } from 'vue'
import { useAPIStore } from '@/stores/api.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import defaultPlaceholder from '@/assets/images/avatars/anonymous.png'
import avatarMage from '@/assets/images/avatars/mage.png'
import avatarRobot from '@/assets/images/avatars/robot.png'
import avatarDragon from '@/assets/images/avatars/dragon.png'

const apiStore = useAPIStore()

// Game modes for the dropdown
const gameModes = [
  { label: 'Singleplayer Competitive Standalone - Bisca of 3', type: 3, mode: 'S', is_match: false },
  { label: 'Singleplayer Competitive Match - Bisca of 3', type: 3, mode: 'S', is_match: true },
  { label: 'Singleplayer Competitive Standalone - Bisca of 9', type: 9, mode: 'S', is_match: false },
  { label: 'Singleplayer Competitive Match - Bisca of 9', type: 9, mode: 'S', is_match: true },
  { label: 'Multiplayer Standalone - Bisca de 3', type: 3, mode: 'M', is_match: false },
  { label: 'Multiplayer Match - Bisca de 3', type: 3, mode: 'M', is_match: true },
  { label: 'Multiplayer Standalone - Bisca de 9', type: 9, mode: 'M', is_match: false },
  { label: 'Multiplayer Match - Bisca de 9', type: 9, mode: 'M', is_match: true },
]

const selectedGameMode = ref(gameModes[0])
const leaderboardData = ref([])
const leaderboardAvatars = ref({}) // store effective avatar URLs
const isLoading = ref(false)
const errorMessage = ref('')

// Helper function to determine avatar URL based on custom field
const getEffectiveAvatar = (player) => {
  try {
    // Parse custom JSON if it's a string
    const customData = typeof player.custom === 'string' ? JSON.parse(player.custom) : player.custom
    const selectedKey = customData?.avatars?.selected ?? 'default'

    if (selectedKey === 'default') {
      return player.avatar 
        ? apiStore.photoAvatarStorageURL + player.avatar 
        : defaultPlaceholder
    }

    // Map purchased avatars to local images
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
    console.error('Error determining avatar for player', player.username, e)
    return defaultPlaceholder
  }
}

// Fetch leaderboard for the selected game mode
const fetchLeaderboard = async (modeObject) => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await apiStore.getLeaderboard({
      type: modeObject.type,
      mode: modeObject.mode,
      is_match: modeObject.is_match,
    })

    // Map fields for template
    leaderboardData.value = response.data.map(p => ({
      id: p.winner_user_id,
      username: p.username,
      avatar: p.avatar_filename,
      wins: p.total_wins,
      capotes: p.total_capotes,
      bandeiras: p.total_bandeiras,
      custom: p.custom,
    }))

    // Setup effective avatars
    const avatars = {}
    leaderboardData.value.forEach(player => {
      avatars[player.id] = getEffectiveAvatar(player)
    })
    leaderboardAvatars.value = avatars

    console.log('Leaderboard data loaded:', leaderboardData.value)
  } catch (err) {
    console.error('Failed to load leaderboard:', err)
    leaderboardData.value = []
    errorMessage.value = 'Failed to fetch leaderboard. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Update selected mode
const handleGameModeChange = async (modeObject) => {
  selectedGameMode.value = modeObject
  await fetchLeaderboard(modeObject)
}

// Fallback when an image fails to load
const onAvatarError = (playerId) => {
  leaderboardAvatars.value[playerId] = defaultPlaceholder
}

// Initial fetch
fetchLeaderboard(selectedGameMode.value)
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
                    :key="mode.label"
                    :value="mode"
                  >
                    {{ mode.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Leaderboard -->
            <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div class="max-h-64 overflow-y-auto">

                <!-- No Data -->
                <div 
                  v-if="leaderboardData.length === 0" 
                  class="p-6 text-center text-sm text-muted-foreground"
                >
                  No leaderboard data available yet.
                </div>

                <!-- With Data -->
                <div v-else>

                  <!-- Header -->
                  <div class="grid grid-cols-4 text-xs font-semibold px-3 py-2 border-b bg-muted/30">
                    <div class="col-span-1 flex items-center gap-3 pl-6">Player</div>
                    <div class="text-right col-span-1 pl-6">Wins</div>
                    <div class="text-right col-span-1 pl-6">Capotes</div>
                    <div class="text-right col-span-1 pl-6">Bandeiras</div>
                  </div>

                  <!-- Rows -->
                  <div 
                    v-for="(player, index) in leaderboardData" 
                    :key="index"
                    class="grid grid-cols-4 items-center px-3 py-3 border-b hover:bg-muted/50 transition-colors"
                    :class="{
                      'bg-yellow-100 dark:bg-yellow-900': index === 0,
                      'bg-gray-100 dark:bg-gray-800': index === 1,
                      'bg-orange-100 dark:bg-orange-900': index === 2
                    }"
                  >

                    <!-- Player Column -->
                    <div class="flex items-center gap-2 col-span-1">
                      <!-- Rank Circle -->
                      <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-muted-foreground dark:text-muted-foreground">
                        {{ index + 1 }}
                      </div>

                      <!-- Avatar -->
                    <Avatar class="h-8 w-8">
                      <AvatarImage
                        :src="getEffectiveAvatar(player)"
                        @error="(e) => e.target.src = defaultPlaceholder"
                      />

                      <AvatarFallback>
                        <img
                          :src="defaultPlaceholder"
                          alt="Anonymous Avatar"
                          class="h-8 w-8 rounded-full"
                        />
                      </AvatarFallback>
                    </Avatar>


                      <!-- Username -->
                      <div class="flex flex-col">
                        <span class="font-medium text-sm">{{ player.username }}</span>
                      </div>
                    </div>

                    <!-- Wins -->
                    <div class="text-sm font-medium text-right col-span-1">
                      {{ player.wins }}
                    </div>

                    <!-- Capotes -->
                    <div class="text-sm font-medium text-right col-span-1">
                      {{ player.capotes }}
                    </div>

                    <!-- Bandeiras -->
                    <div class="text-sm font-medium text-right col-span-1">
                      {{ player.bandeiras }}
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