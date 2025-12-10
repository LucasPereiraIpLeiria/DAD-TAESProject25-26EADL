<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useAPIStore } from '@/stores/api'
import PageContainer from '@/components/ui/PageContainer.vue'
import UiCard from '@/components/ui/UiCard.vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

const api = useAPIStore()

// ---------- STATE ----------
const filters = reactive({
  from: '',
  to: '',
  result: '',
  achievement: '',
  order: 'desc',
})

const isLoading = ref(false)
const errorMessage = ref('')

const matches = ref([])
const games = ref([])

// ---------- HELPERS ----------
function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function formatDuration(seconds) {
  if (seconds == null) return '—'
  const s = Number(seconds)
  if (Number.isNaN(s) || s < 0) return '—'
  const mins = Math.floor(s / 60)
  const secs = s % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

function biscaVariantLabel(type) {
  if (type === 3 || type === '3') return 'Bisca de 3'
  if (type === 9 || type === '9') return 'Bisca de 9'
  return `Type ${type}`
}

function resultLabel(result) {
  if (result === 'win') return 'Victory'
  if (result === 'loss') return 'Defeat'
  if (result === 'draw') return 'Draw'
  return result ?? '—'
}

function resultPillClass(result) {
  switch (result) {
    case 'win':
      return 'bg-green-100 text-green-800 border border-green-200'
    case 'loss':
      return 'bg-red-100 text-red-800 border border-red-200'
    case 'draw':
      return 'bg-gray-100 text-gray-800 border border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200'
  }
}

// ---------- API CALLS ----------
async function loadHistory() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await api.getUserHistory({
      from: filters.from || undefined,
      to: filters.to || undefined,
      result: filters.result || undefined,
      achievement: filters.achievement || undefined,
      order: filters.order || undefined,
    })

    matches.value = response.data.matches ?? []
    games.value = response.data.games ?? []
  } catch (err) {
    console.error('Failed to load history', err)
    errorMessage.value = 'Failed to load history. Please try again.'
    matches.value = []
    games.value = []
  } finally {
    isLoading.value = false
  }
}

function applyFilters() {
  loadHistory()
}

// ---------- COMPUTED ----------
const hasAnyHistory = computed(() => {
  return (matches.value?.length ?? 0) > 0 || (games.value?.length ?? 0) > 0
})

onMounted(async () => {
  await loadHistory()
})
</script>

<template>
  <PageContainer max-width="xl">
    <UiCard padding="md">
      <div class="space-y-6">
        <!-- Header -->
        <header class="flex flex-col gap-1 mb-2">
          <h1 class="text-2xl font-semibold">
            Game History
          </h1>
          <p class="text-sm text-gray-600">
            Review your Bisca matches and games, with filters by date, result and achievements.
          </p>
        </header>

        <!-- Filters -->
        <section class="border rounded-lg p-4 bg-gray-50 space-y-3">
          <h2 class="text-sm font-semibold mb-1">
            Filters
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-700">From date</label>
              <input
                v-model="filters.from"
                type="date"
                class="border rounded px-2 py-1 text-sm"
              >
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-700">To date</label>
              <input
                v-model="filters.to"
                type="date"
                class="border rounded px-2 py-1 text-sm"
              >
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-700">Result</label>
              <select
                v-model="filters.result"
                class="border rounded px-2 py-1 text-sm"
              >
                <option value="">All</option>
                <option value="win">Victory</option>
                <option value="loss">Defeat</option>
                <option value="draw">Draw</option>
              </select>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-700">Achievement</label>
              <select
                v-model="filters.achievement"
                class="border rounded px-2 py-1 text-sm"
              >
                <option value="">All</option>
                <option value="capote">Capote</option>
                <option value="bandeira">Bandeira</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-between flex-wrap gap-2 mt-2">
            <div class="flex items-center gap-3 text-xs">
              <span class="font-medium text-gray-700">Order by date:</span>
              <label class="flex items-center gap-1">
                <input
                  v-model="filters.order"
                  type="radio"
                  value="desc"
                >
                <span>Newest first</span>
              </label>
              <label class="flex items-center gap-1">
                <input
                  v-model="filters.order"
                  type="radio"
                  value="asc"
                >
                <span>Oldest first</span>
              </label>
            </div>

            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              @click="applyFilters"
            >
              Apply filters
            </button>
          </div>

          <p
            v-if="errorMessage"
            class="text-xs text-red-600 mt-1"
          >
            {{ errorMessage }}
          </p>
        </section>

        <!-- History lists -->
        <section class="space-y-3">
          <h2 class="text-lg font-semibold">
            History
          </h2>

          <p v-if="isLoading" class="text-sm text-gray-500">
            Loading history...
          </p>

          <p
            v-else-if="!hasAnyHistory"
            class="text-sm text-gray-500"
          >
            No matches or games registered yet.
          </p>

          <div
            v-else
            class="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <!-- Matches -->
            <Card>
              <CardHeader>
                <CardTitle class="text-base">Matches</CardTitle>
                <CardDescription>
                  All your matches, ordered by date ({{ filters.order === 'desc' ? 'newest first' : 'oldest first' }}).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-2">
                  <div
                    v-for="match in matches"
                    :key="match.id"
                    class="border rounded-md p-2 text-xs space-y-1 bg-white"
                  >
                    <div class="flex justify-between items-center">
                      <div class="font-medium">
                        {{ biscaVariantLabel(match.type) }}
                      </div>
                      <span
                        class="px-2 py-0.5 rounded-full text-[11px]"
                        :class="resultPillClass(match.result)"
                      >
                        {{ resultLabel(match.result) }}
                      </span>
                    </div>

                    <div class="flex justify-between text-[11px] text-gray-600">
                      <span>Ended: {{ formatDateTime(match.ended_at) }}</span>
                      <span>Duration: {{ formatDuration(match.duration) }}</span>
                    </div>

                    <div class="flex justify-between text-[11px] mt-1">
                      <span>
                        Coins earned:
                        <strong class="text-yellow-700">{{ match.coins_earned }}</strong>
                      </span>
                      <span class="flex gap-1">
                        <span
                          v-if="match.achievements?.bandeira"
                          class="px-1.5 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700"
                        >
                          Bandeira
                        </span>
                        <span
                          v-else-if="match.achievements?.capote"
                          class="px-1.5 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700"
                        >
                          Capote
                        </span>
                      </span>
                    </div>

                    <details class="mt-1">
                      <summary class="cursor-pointer text-[11px] text-gray-700">
                        Games ({{ match.games?.length ?? 0 }})
                      </summary>
                      <div class="mt-1 space-y-1">
                        <div
                          v-for="g in match.games"
                          :key="g.id"
                          class="flex justify-between text-[11px] border rounded px-1 py-0.5 bg-gray-50"
                        >
                          <div>
                            Game #{{ g.game_number }} —
                            {{ g.user_points }} x {{ g.opponent_points }}
                            <span
                              class="ml-1 px-1 py-0.5 rounded"
                              :class="resultPillClass(g.result)"
                            >
                              {{ resultLabel(g.result) }}
                            </span>
                          </div>
                          <div class="flex gap-1 items-center">
                            <span
                              v-if="g.achievements?.bandeira"
                              class="px-1 rounded border border-indigo-200 bg-indigo-50 text-indigo-700"
                            >
                              Bandeira
                            </span>
                            <span
                              v-else-if="g.achievements?.capote"
                              class="px-1 rounded border border-purple-200 bg-purple-50 text-purple-700"
                            >
                              Capote
                            </span>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Games -->
            <Card>
              <CardHeader>
                <CardTitle class="text-base">Games</CardTitle>
                <CardDescription>
                  Individual games, including standalone and games within matches.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-2">
                  <div
                    v-for="game in games"
                    :key="game.id"
                    class="border rounded-md p-2 text-xs space-y-1 bg-white"
                  >
                    <div class="flex justify-between items-center">
                      <div class="font-medium">
                        {{ biscaVariantLabel(game.type) }}
                        <span v-if="game.match_id" class="text-[11px] text-gray-500 ml-1">
                          (match #{{ game.match_id }})
                        </span>
                      </div>
                      <span
                        class="px-2 py-0.5 rounded-full text-[11px]"
                        :class="resultPillClass(game.result)"
                      >
                        {{ resultLabel(game.result) }}
                      </span>
                    </div>

                    <div class="flex justify-between text-[11px] text-gray-600">
                      <span>Ended: {{ formatDateTime(game.ended_at) }}</span>
                      <span>Duration: {{ formatDuration(game.duration) }}</span>
                    </div>

                    <div class="flex justify-between text-[11px] mt-1">
                      <span>
                        Score:
                        <strong>{{ game.user_points }}</strong> x
                        <strong>{{ game.opponent_points }}</strong>
                      </span>
                      <span class="flex gap-1">
                        <span
                          v-if="game.achievements?.bandeira"
                          class="px-1.5 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700"
                        >
                          Bandeira
                        </span>
                        <span
                          v-else-if="game.achievements?.capote"
                          class="px-1.5 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700"
                        >
                          Capote
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </UiCard>
  </PageContainer>
</template>
