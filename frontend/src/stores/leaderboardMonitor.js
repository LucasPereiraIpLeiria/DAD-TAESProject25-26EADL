import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

export const useLeaderboardMonitor = defineStore('leaderboardMonitor', () => {
  const leaderboardCache = ref({})
  let router = null

  // Set router from outside (called from App.vue)
  const setRouter = (routerInstance) => {
    router = routerInstance
  }

  // Generate a unique key for each leaderboard configuration
  const getCacheKey = (config) => {
    return `${config.type}_${config.mode}_${config.is_match}`
  }

  // Check if leaderboard data has changed
  const checkForChanges = (config, newData) => {
    const cacheKey = getCacheKey(config)
    const oldData = leaderboardCache.value[cacheKey]

    // Store new data
    leaderboardCache.value[cacheKey] = JSON.stringify(newData)

    // If no previous data, skip notification
    if (!oldData) {
      console.log(`[Leaderboard Monitor] First load for ${cacheKey}`)
      return
    }

    // Parse old data and compare
    const oldDataParsed = JSON.parse(oldData)

    // Check if top players changed or points changed
    const hasChanges = hasLeaderboardChanged(oldDataParsed, newData)

    if (hasChanges) {
      console.log(`[Leaderboard Monitor] Changes detected for ${cacheKey}`)
      notifyLeaderboardChange(config, newData)
    }
  }

  // Helper function to detect meaningful changes
  const hasLeaderboardChanged = (oldData, newData) => {
    if (oldData.length !== newData.length) {
      console.log('[Leaderboard Monitor] Length changed:', oldData.length, '→', newData.length)
      return true
    }

    // Check top 5 players for changes
    const checkLimit = Math.min(5, oldData.length, newData.length)

    for (let i = 0; i < checkLimit; i++) {
      const oldPlayer = oldData[i]
      const newPlayer = newData[i]

      if (oldPlayer.username !== newPlayer.username) {
        console.log(`[Leaderboard Monitor] Position ${i+1} username changed:`, oldPlayer.username, '→', newPlayer.username)
        return true
      }
      if (oldPlayer.wins !== newPlayer.wins) {
        console.log(`[Leaderboard Monitor] Position ${i+1} wins changed:`, oldPlayer.wins, '→', newPlayer.wins)
        return true
      }
      if (oldPlayer.points !== newPlayer.points) {
        console.log(`[Leaderboard Monitor] Position ${i+1} points changed:`, oldPlayer.points, '→', newPlayer.points)
        return true
      }
    }

    return false
  }

  // Notify about leaderboard changes using vue-sonner
  const notifyLeaderboardChange = (config, newData) => {
    const modeLabel = `${config.type === 3 ? 'Bisca 3' : 'Bisca 9'} - ${config.mode === 'S' ? 'Singleplayer' : 'Multiplayer'}`
    const topPlayer = newData[0]

    console.log(`[Leaderboard Monitor] Showing toast for ${modeLabel}`)

    toast.success(`${topPlayer.username} is now leading in ${modeLabel}!`, {
      description: 'Leaderboard Updated 🏆',
      action: {
        label: 'View',
        onClick: () => {
          console.log('[Leaderboard Monitor] User clicked View - navigating to home with mode:', config)
          router.push({
            name: 'home',
            query: {
              selectedType: config.type,
              selectedMode: config.mode,
              selectedIsMatch: config.is_match
            }
          })
        }
      }
    })
  }

  return { checkForChanges, notifyLeaderboardChange, leaderboardCache, setRouter }
})
