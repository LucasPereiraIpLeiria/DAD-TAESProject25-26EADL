<template>
  <div class="flex flex-row justify-center items-start gap-5 mt-10">

    <!-- Card 1: Os Meus Matches -->
    <Card class="w-full max-w-md">

    </Card>

    <!-- Card 2: Placeholder -->
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Outro Card</CardTitle>
      </CardHeader>
      <CardContent>
        Conteúdo adicional aqui.
      </CardContent>
    </Card>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAPIStore } from '@/stores/api.js'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'

// API Store
const apiStore = useAPIStore()
const authStore = useAuthStore()

// Reactive variables
const gamesData = ref([])
const authUser = ref({})
const loading = ref(true)

// Fetch data on mounted
onMounted(async () => {
  loading.value = true
  // Get authenticated user
  authUser.value = await authStore.currentUser
  // Fetch user matches
  const response = await apiStore.getUserGames() // should return { data: [...] }
  gamesData.value = response.data.map(g => ({ ...g })) 

  //gamesData.value = response.data
  //console.log(gamesData.value[0].winner_user_id)
  loading.value = false
})
</script>

<style scoped>
/* Optional: adjust table styling if needed */
</style>
