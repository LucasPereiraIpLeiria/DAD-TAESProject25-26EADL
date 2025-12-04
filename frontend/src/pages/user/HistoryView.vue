<template>
  <div class="flex flex-col justify-center items-center gap-5 mt-10 w-full max-w-3xl mx-auto">

    <!-- Filtros -->
    <div class="flex flex-wrap gap-3 mb-4 items-center">
      <select v-model="filterBy" class="border rounded px-2 py-1">
        <option value="all">Todos</option>
        <option value="won">Ganhou</option>
        <option value="lost">Perdeu</option>
      </select>

      <input type="date" v-model="startDate" class="border rounded px-2 py-1" placeholder="De" />
      <input type="date" v-model="endDate" class="border rounded px-2 py-1" placeholder="Até" />

      <select v-model="sortBy" class="border rounded px-2 py-1">
        <option value="date">Data</option>
        <option value="points">Pontos</option>
      </select>
    </div>

    <!-- Card 1: Os Meus Matches -->
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Os Meus Matches</CardTitle>
      </CardHeader>

      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-auto mx-auto divide-y divide-gray-200 text-center">
            <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-2 text-sm font-medium text-gray-700">ID</th>
              <th class="px-4 py-2 text-sm font-medium text-gray-700">Data</th>
              <th class="px-4 py-2 text-sm font-medium text-gray-700">Resultado</th>
              <th class="px-4 py-2 text-sm font-medium text-gray-700">Pontos</th>
            </tr>
            </thead>

            <tbody class="divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="5" class="px-4 py-2 text-gray-500">Carregando...</td>
            </tr>

            <tr v-else-if="filteredGames.length === 0">
              <td colspan="5" class="px-4 py-2 text-gray-500">Nenhum match encontrado</td>
            </tr>

            <tr v-else v-for="game in filteredGames" :key="game.id">
              <td class="px-4 py-2">{{ game.id }}</td>
              <td class="px-4 py-2">{{ formatDate(game.ended_at) }}</td>
              <td class="px-4 py-2">
                  <span
                    :class="Number(game.winner_user_id) === Number(authUser.id) ? 'bg-green-500' : 'bg-red-500'"
                    class="text-white px-2 py-1 rounded-full text-xs"
                  >
                    {{ Number(game.winner_user_id) === Number(authUser.id) ? 'Ganhou' : 'Perdeu' }}
                  </span>
              </td>
              <td class="px-4 py-2">
                {{ authUser.id === game.player1_user_id ? game.player1_points : game.player2_points }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAPIStore } from '@/stores/api.js'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'

// Stores
const apiStore = useAPIStore()
const authStore = useAuthStore()

// Reactive variables
const gamesData = ref([])
const authUser = ref({})
const loading = ref(true)

// Filtros
const filterBy = ref('all')
const sortBy = ref('date')
const startDate = ref(null)
const endDate = ref(null)

// Função para formatar datas
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const options = { day: 'numeric', month: 'long', year: 'numeric' }
  return d.toLocaleDateString('pt-PT', options)
}

// Computed para aplicar filtros
const filteredGames = computed(() => {
  let filtered = [...gamesData.value]

  // Filtrar por resultado
  if (filterBy.value === 'won') {
    filtered = filtered.filter(g => Number(g.winner_user_id) === Number(authUser.value.id))
  } else if (filterBy.value === 'lost') {
    filtered = filtered.filter(g => Number(g.winner_user_id) !== Number(authUser.value.id))
  }

  // Datas
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value)
    const end = new Date(endDate.value)

    if (start.toDateString() === end.toDateString()) {
      filtered = filtered.filter(g => new Date(g.ended_at).toDateString() === start.toDateString())
    } else {
      filtered = filtered.filter(g => {
        const gameDate = new Date(g.ended_at)
        return gameDate >= start && gameDate <= end
      })
    }
  } else if (startDate.value) {
    const start = new Date(startDate.value)
    filtered = filtered.filter(g => new Date(g.ended_at) >= start)
  } else if (endDate.value) {
    const end = new Date(endDate.value)
    filtered = filtered.filter(g => new Date(g.ended_at) <= end)
  }

  // Ordenar
  if (sortBy.value === 'date') {
    filtered.sort((a, b) => new Date(b.ended_at) - new Date(a.ended_at))
  } else if (sortBy.value === 'points') {
    filtered.sort((a, b) => {
      const pointsA = authUser.value.id === a.player1_user_id ? a.player1_points : a.player2_points
      const pointsB = authUser.value.id === b.player1_user_id ? b.player1_points : b.player2_points
      return pointsB - pointsA
    })
  }

  return filtered
})

// Fetch data
onMounted(async () => {
  loading.value = true
  authUser.value = await authStore.currentUser

  const response = await apiStore.getUserGames()
  gamesData.value = response.data.map(g => ({ ...g }))

  loading.value = false
})
</script>

<style scoped>
/* Ajuste opcional do estilo da tabela */
</style>
