<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAPIStore } from '@/stores/api.js'
import { useLeaderboardMonitor } from '@/stores/leaderboardMonitor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import defaultPlaceholder from '@/assets/images/avatars/anonymous.png'
import avatarMage from '@/assets/images/avatars/mage.png'
import avatarRobot from '@/assets/images/avatars/robot.png'
import avatarDragon from '@/assets/images/avatars/dragon.png'

const apiStore = useAPIStore()
const leaderboardMonitor = useLeaderboardMonitor()

const currentUserId = ref(null)
const activities = ref([])

const filters = ref({
  startDate: '',
  endDate: '',
  result: '',
  activityType: '',
  achievement: '',
})

const filteredActivities = computed(() => {
  return activities.value.filter((activity) => {
    if (filters.value.startDate) {
      const activityDate = new Date(activity.ended_at)
      const startDate = new Date(filters.value.startDate)
      if (activityDate < startDate) return false
    }

    if (filters.value.endDate) {
      const activityDate = new Date(activity.ended_at)
      const endDate = new Date(filters.value.endDate)
      endDate.setHours(23, 59, 59, 999)
      if (activityDate > endDate) return false
    }

    if (filters.value.result) {
      let userResult
      if (activity.is_draw) {
        userResult = 'draw'
      } else {
        userResult = activity.winner_user_id === currentUserId.value ? 'win' : 'loss'
      }
      if (userResult !== filters.value.result) return false
    }

    if (filters.value.activityType && activity.activity_type !== filters.value.activityType) {
      return false
    }

    if (filters.value.achievement) {
      const hasCapote =
        activity.player1_user_id === currentUserId.value
          ? activity.player1_points >= 91 && activity.player1_points <= 119
          : activity.player2_points >= 91 && activity.player2_points <= 119

      const hasBandeira =
        activity.player1_user_id === currentUserId.value
          ? activity.player1_points === 120
          : activity.player2_points === 120

      if (filters.value.achievement === 'capote' && !hasCapote) return false
      if (filters.value.achievement === 'bandeira' && !hasBandeira) return false
    }

    return true
  })
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDuration = (seconds) => {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

const getResult = (activity) => {
  if (activity.is_draw) return 'Draw'
  return activity.winner_user_id === currentUserId.value ? 'Win' : 'Loss'
}

const getMatchCoins = (activity) => {
  const userPoints =
    activity.player1_user_id === currentUserId.value
      ? activity.player1_points
      : activity.player2_points

  let baseReward = 10
  let bonus = 0

  if (userPoints === 120) {
    bonus = 20 // bandeira bonus
  } else if (userPoints >= 91 && userPoints <= 119) {
    bonus = 10 // capote bonus
  }

  return baseReward + bonus
}

const resetFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    result: '',
    activityType: '',
    achievement: '',
  }
}

// Game modes for the dropdown
const gameModes = [
  {
    label: 'Singleplayer Competitive Standalone - Bisca of 3',
    type: 3,
    mode: 'S',
    is_match: false,
  },
  { label: 'Singleplayer Competitive Match - Bisca of 3', type: 3, mode: 'S', is_match: true },
  {
    label: 'Singleplayer Competitive Standalone - Bisca of 9',
    type: 9,
    mode: 'S',
    is_match: false,
  },
  { label: 'Singleplayer Competitive Match - Bisca of 9', type: 9, mode: 'S', is_match: true },
  { label: 'Multiplayer Standalone - Bisca de 3', type: 3, mode: 'M', is_match: false },
  { label: 'Multiplayer Match - Bisca de 3', type: 3, mode: 'M', is_match: true },
  { label: 'Multiplayer Standalone - Bisca de 9', type: 9, mode: 'M', is_match: false },
  { label: 'Multiplayer Match - Bisca de 9', type: 9, mode: 'M', is_match: true },
]

const selectedGameMode = ref(gameModes[0])
const leaderboardData = ref([])
const leaderboardAvatars = ref({})
const isLoading = ref(false)
const errorMessage = ref('')
let pollInterval = null

const route = useRoute()

const getEffectiveAvatar = (player) => {
  try {
    const customData = typeof player.custom === 'string' ? JSON.parse(player.custom) : player.custom
    const selectedKey = customData?.avatars?.selected ?? 'default'

    if (selectedKey === 'default') {
      return player.avatar ? apiStore.photoAvatarStorageURL + player.avatar : defaultPlaceholder
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
    console.error('Error determining avatar for player', player.username, e)
    return defaultPlaceholder
  }
}

const fetchLeaderboard = async (modeObject) => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await apiStore.getLeaderboard({
      type: modeObject.type,
      mode: modeObject.mode,
      is_match: modeObject.is_match,
    })

    const mappedData = response.data.map((p) => ({
      id: p.winner_user_id,
      username: p.username,
      avatar: p.avatar_filename,
      wins: p.total_wins,
      capotes: p.total_capotes,
      bandeiras: p.total_bandeiras,
      custom: p.custom,
    }))

    leaderboardMonitor.checkForChanges(modeObject, mappedData)
    leaderboardData.value = mappedData

    const avatars = {}
    leaderboardData.value.forEach((player) => {
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

const startPolling = (modeObject) => {
  if (pollInterval) clearInterval(pollInterval)
  pollInterval = setInterval(() => {
    fetchLeaderboard(modeObject)
  }, 30000)
}

const handleGameModeChange = async (modeObject) => {
  selectedGameMode.value = modeObject
  await fetchLeaderboard(modeObject)
  startPolling(modeObject)
}

const onAvatarError = (playerId) => {
  leaderboardAvatars.value[playerId] = defaultPlaceholder
}

onMounted(async () => {
  const selectedType = route.query.selectedType
  const selectedMode = route.query.selectedMode
  const selectedIsMatch = route.query.selectedIsMatch

  if (selectedType && selectedMode && selectedIsMatch !== undefined) {
    const requestedMode = gameModes.find(
      (m) =>
        m.type === parseInt(selectedType) &&
        m.mode === selectedMode &&
        m.is_match === (selectedIsMatch === 'true'),
    )

    if (requestedMode) {
      selectedGameMode.value = requestedMode
    }
  }

  fetchLeaderboard(selectedGameMode.value)
  startPolling(selectedGameMode.value)

  if (apiStore.token) {
    try {
      const user = await apiStore.getAuthUser()
      currentUserId.value = user.data.id
      const response = await apiStore.getUserActivities(user.data.id)
      activities.value = response.data.activities || []
    } catch (error) {
      console.error('Failed to load activities:', error)
    }
  }
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Top Block - Full Width -->
      <Card>
        <CardHeader>
          <CardTitle class="text-3xl font-bold"> Welcome to PlayBisca </CardTitle>
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
              Dive into solo matches and improve your skills by playing against AI opponents in
              practice or competitive modes.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <RouterLink :to="{ name: 'singleplayer.mode.select' }">
              <Button class="w-full" variant="default"> Singleplayer Mode Selection </Button>
            </RouterLink>
          </CardContent>
        </Card>

        <!-- Right Card -->
        <Card>
          <CardHeader>
            <CardTitle class="text-2xl">Multiplayer</CardTitle>
            <CardDescription>
              Join multiplayer matches, compete with other players, and climb the leaderboards.
              Multiplayer mode is coming soon!
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <RouterLink :to="{ name: 'singleplayer.mode.select' }">
              <Button class="w-full" variant="default"> Multiplayer Mode Selection </Button>
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
            <CardDescription> View top players for each game mode </CardDescription>
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
                  <SelectItem v-for="mode in gameModes" :key="mode.label" :value="mode">
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
                  <div
                    class="grid grid-cols-4 text-xs font-semibold px-3 py-2 border-b bg-muted/30"
                  >
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
                      'bg-orange-100 dark:bg-orange-900': index === 2,
                    }"
                  >
                    <!-- Player Column -->
                    <div class="flex items-center gap-2 col-span-1">
                      <!-- Rank Circle -->
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-muted-foreground dark:text-muted-foreground"
                      >
                        {{ index + 1 }}
                      </div>

                      <!-- Avatar -->
                      <Avatar class="h-8 w-8">
                        <AvatarImage
                          :src="getEffectiveAvatar(player)"
                          @error="(e) => (e.target.src = defaultPlaceholder)"
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
            <CardDescription> View your recent matches and performance </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <!-- Not Logged In -->
            <div v-if="!apiStore.token" class="p-6 text-center">
              <p class="text-sm text-muted-foreground mb-4">
                No data to be shown. You must log in to view your match history.
              </p>
              <RouterLink :to="{ name: 'login' }">
                <Button class="w-full" variant="default"> Log In </Button>
              </RouterLink>
            </div>

            <!-- Logged In -->
            <div v-else>
              <!-- Filters -->
              <div class="filters">
                <div class="filter-group">
                  <label>Date Range</label>
                  <input v-model="filters.startDate" type="date" />
                  <input v-model="filters.endDate" type="date" />
                </div>

                <div class="filter-group">
                  <label>Result</label>
                  <select v-model="filters.result">
                    <option value="">All Results</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="draw">Draw</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label>Type</label>
                  <select v-model="filters.activityType">
                    <option value="">All Types</option>
                    <option value="match">Matches</option>
                    <option value="game">Games</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label>Achievement</label>
                  <select v-model="filters.achievement">
                    <option value="">All</option>
                    <option value="capote">Capote (91-119 pts)</option>
                    <option value="bandeira">Bandeira (120 pts)</option>
                  </select>
                </div>

                <button @click="resetFilters" class="reset-btn">Reset</button>
              </div>

              <!-- Table -->
              <div class="table-container">
                <table class="activities-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Duration</th>
                      <th>Result</th>
                      <th>Points</th>
                      <th>Coins Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="activity in filteredActivities"
                      :key="`${activity.id}-${activity.activity_type}`"
                    >
                      <td>{{ formatDate(activity.ended_at) }}</td>
                      <td class="type-badge" :class="activity.activity_type">
                        {{ activity.activity_type }}
                      </td>
                      <td>{{ formatDuration(activity.total_time) }}</td>
                      <td
                        class="result"
                        :class="
                          activity.is_draw
                            ? 'draw'
                            : activity.winner_user_id === currentUserId
                              ? 'win'
                              : 'loss'
                        "
                      >
                        {{ getResult(activity) }}
                      </td>
                      <td class="points">
                        {{
                          activity.player1_user_id === currentUserId
                            ? activity.player1_points
                            : activity.player2_points
                        }}
                      </td>
                      <td class="coins">
                        {{
                          activity.winner_user_id === currentUserId
                            ? activity.activity_type === 'match'
                              ? getMatchCoins(activity)
                              : 2
                            : 0
                        }}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div v-if="filteredActivities.length === 0" class="no-data">
                  No activities found matching your filters.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.filter-group input,
.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.reset-btn {
  padding: 8px 16px;
  background-color: #888;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.reset-btn:hover {
  background-color: #666;
}

.table-container {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.activities-table {
  width: 100%;
  border-collapse: collapse;
}

.activities-table thead {
  position: sticky;
  top: 0;
  background-color: #f5f5f5;
}

.activities-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid #ddd;
}

.activities-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.type-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.type-badge.match {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-badge.game {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.result {
  font-weight: 600;
}

.result.win {
  color: #4caf50;
}

.result.loss {
  color: #f44336;
}

.result.draw {
  color: #ff9800;
}

.points {
  font-weight: 600;
  color: #333;
}

.coins {
  font-weight: 600;
  color: #ffd700;
}

.no-data {
  padding: 40px;
  text-align: center;
  color: #999;
}
</style>
