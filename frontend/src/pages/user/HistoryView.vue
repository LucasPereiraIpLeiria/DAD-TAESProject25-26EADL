<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useAPIStore } from '@/stores/api'
import PageContainer from '@/components/ui/PageContainer.vue'
import UiCard from '@/components/ui/UiCard.vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const api = useAPIStore()

// ---------- STATE ----------
const filters = reactive({
  from: '',
  to: '',
  result: '',
  achievement: '',
  order: 'desc',
  type: '9', // DEFAULT: Bisca of 9
})

const isLoading = ref(false)
const errorMessage = ref('')

const matches = ref([])

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
  if (type === 3 || type === '3') return 'Bisca of 3'
  if (type === 9 || type === '9') return 'Bisca of 9'
  return `Type ${type}`
}

function resultLabel(result) {
  if (result === 'win') return 'Victory'
  if (result === 'loss') return 'Defeat'
  if (result === 'draw') return 'Draw'
  if (result === 'interrupted') return 'Interrupted'
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
    case 'interrupted':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
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
      type: filters.type || undefined,
    })

    matches.value = response.data.matches ?? []
  } catch (err) {
    console.error('Failed to load history', err)
    errorMessage.value = 'Failed to load history. Please try again.'
    matches.value = []
  } finally {
    isLoading.value = false
  }
}

function applyFilters() {
  loadHistory()
}

// ---------- AUTO LOAD ----------

// Ao abrir a página, faz logo load com type = '9'
onMounted(() => {
  loadHistory()
})

// Sempre que se muda o toggle Bisca of 9 / 3, recarrega automaticamente
watch(
  () => filters.type,
  () => {
    loadHistory()
  }
)


watch(
  () => filters.achievement,
  (val) => {
    // Se escolher capote ou bandeira, força automaticamente result = 'win'
    if (val) {
      filters.result = 'win'
    }

  }
)

// ---------- COMPUTED ----------
const hasAnyHistory = computed(() => {
  return (matches.value?.length ?? 0) > 0
})
</script>

<template>
  <PageContainer max-width="xl">
    <UiCard padding="md" background="bg-white/90">
      <div class="space-y-6 ">
        <header class="flex flex-col gap-1 mb-2">
          <h1 class="text-2xl font-semibold">
            Game History
          </h1>
          <p class="text-sm text-gray-600">
            Review your Bisca matches and games, with filters by date, result and achievements.
          </p>
        </header>

        <!-- Filters -->
        <section class="border rounded-lg p-4 bg-gray-200 space-y-3">
          <h2 class="text-sm font-semibold mb-1">
            Filters
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-700">From date</label>
              <input v-model="filters.from" type="date" class="border rounded px-2 py-1 text-sm bg-white">
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-700">To date</label>
              <input v-model="filters.to" type="date" class="border rounded px-2 py-1 text-sm bg-white">
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-700">Result</label>
              <select v-model="filters.result" class="border rounded px-2 py-1 text-sm bg-white">
                <option value="">All</option>
                <option value="win">Victory</option>
                <option value="loss">Defeat</option>
                <option value="interrupted">Interrupted</option>
              </select>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-700">Achievement</label>
              <select v-model="filters.achievement" class="border rounded px-2 py-1 text-sm bg-white">
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
                <input v-model="filters.order" type="radio" value="desc">
                <span>Newest first</span>
              </label>
              <label class="flex items-center gap-1">
                <input v-model="filters.order" type="radio" value="asc">
                <span>Oldest first</span>
              </label>
            </div>

            <Button variant="default" class="px-4 py-2 text-sm" @click="applyFilters">
              Apply filters
            </Button>
          </div>

          <p v-if="errorMessage" class="text-xs text-red-600 mt-1">
            {{ errorMessage }}
          </p>
        </section>

        <!-- History list -->
        <section class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-lg font-semibold">
              History
            </h2>
          </div>

          <p v-if="isLoading" class="text-sm text-gray-500">
            Loading history...
          </p>

          <p v-else-if="!hasAnyHistory" class="text-sm text-gray-500">
            No matches registered yet.
          </p>

          <div v-else>
            <!-- Only Matches -->
            <Card>
              <CardHeader class="space-y-2">

                
                <div class="flex items-center justify-between">
                  <CardTitle class="text-base">Matches</CardTitle>

                  <!-- Toggle à direita -->
                  <div class="flex items-center gap-3 text-sm">
                    <span class="font-medium text-gray-800 text-sm">Variant:</span>

                    <button type="button" class="px-3 py-1.5 rounded border text-sm font-medium cursor-pointer transition-colors
         hover:bg-indigo-100 hover:border-indigo-300" :class="filters.type === '9'
          ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
          : 'bg-white text-gray-700 border-gray-300'" @click="filters.type = '9'">
                      Bisca of 9
                    </button>

                    <button type="button" class="px-3 py-1.5 rounded border text-sm font-medium cursor-pointer transition-colors
         hover:bg-indigo-100 hover:border-indigo-300" :class="filters.type === '3'
          ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
          : 'bg-white text-gray-700 border-gray-300'" @click="filters.type = '3'">
                      Bisca of 3
                    </button>
                  </div>
                </div>

                
                <CardDescription>
                  All your {{ biscaVariantLabel(filters.type) }} matches,
                  ordered by date ({{ filters.order === 'desc' ? 'newest first' : 'oldest first' }}).
                </CardDescription>

              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div v-for="match in matches" :key="match.id"
                    class="border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-xs sm:text-sm">
                    <!-- Linha horizontal com info principal do match -->
                    <div class="flex flex-wrap items-center gap-2 justify-between">
                      <!-- Resultado -->
                      <span class="px-2 py-0.5 rounded-full text-[11px] sm:text-xs"
                        :class="resultPillClass(match.result)">
                        {{ resultLabel(match.result) }}
                      </span>

                      <!-- Datas -->
                      <span class="text-[11px] sm:text-xs text-gray-700">
                        {{ formatDateTime(match.began_at) }} → {{ formatDateTime(match.ended_at) }}
                      </span>

                      <!-- Duração -->
                      <span class="text-[11px] sm:text-xs text-gray-700">
                        Duration:
                        <strong>{{ formatDuration(match.duration) }}</strong>
                      </span>

                      <!-- Coins -->
                      <span class="text-[11px] sm:text-xs">
                        Coins earned:
                        <strong class="text-yellow-700">{{ match.coins_earned }}</strong>
                      </span>

                      <!-- Achievements: espaço fixo -->
                      <div class="flex justify-end gap-1 w-32">
                        <span v-if="match.achievements?.bandeira"
                          class="px-1.5 py-0.5 rounded-full border border-indigo-200 font-bold bg-indigo-50 text-indigo-700 text-[11px] sm:text-xs whitespace-nowrap">
                          Bandeira
                        </span>
                        <span v-if="match.achievements?.capote"
                          class="px-1.5 py-0.5 rounded-full border border-purple-200 font-bold bg-purple-50 text-purple-700 text-[11px] sm:text-xs whitespace-nowrap">
                          Capote
                        </span>
                      </div>
                    </div>

                    <!-- Games -->
                    <details class="mt-1">
                      <summary class="cursor-pointer text-[11px] text-gray-700">
                        Games ({{ match.games?.length ?? 0 }})
                      </summary>
                      <div class="mt-1 space-y-1">
                        <div v-for="g in match.games" :key="g.id"
                          class="flex justify-between text-[11px] border rounded px-1 py-0.5 bg-white">
                          <div class="flex flex-col gap-0.5">
                            <div>
                              <div class="flex items-center gap-4">
                                <span>Game #{{ g.game_number }}</span>

                                <span>{{ g.user_points }} x {{ g.opponent_points }}</span>

                                <span class="px-1.5 py-0.5 rounded ml-auto" :class="resultPillClass(g.result)">
                                  {{ resultLabel(g.result) }}
                                </span>
                              </div>
                            </div>
                            <div class="text-[10px] text-gray-500">
                              Duration: {{ formatDuration(g.duration) }}
                            </div>
                          </div>
                          <div class="flex gap-1 items-center">
                            <span v-if="g.achievements?.bandeira"
                              class="px-1 rounded border border-indigo-200 bg-indigo-50 font-bold text-indigo-700">
                              Bandeira
                            </span>
                            <span v-else-if="g.achievements?.capote"
                              class="px-1 rounded border border-purple-200 bg-purple-50 font-bold text-purple-700">
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
          </div>
        </section>
      </div>
    </UiCard>
  </PageContainer>
</template>
