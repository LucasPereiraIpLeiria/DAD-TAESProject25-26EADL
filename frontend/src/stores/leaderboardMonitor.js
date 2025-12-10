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

    // For standalone games, check if top player has a match version
    if (!config.is_match) {
      // Get the corresponding match leaderboard cache key
      const matchCacheKey = `${config.type}_${config.mode}_true`
      const matchData = leaderboardCache.value[matchCacheKey]

      // If match data exists and top player is in match leaderboard, skip notification
      if (matchData) {
        const matchDataParsed = JSON.parse(matchData)
        const topPlayerInMatch = matchDataParsed.some(p => p.username === newData[0].username)

        if (topPlayerInMatch) {
          leaderboardCache.value[cacheKey] = JSON.stringify(newData)
          return
        }
      }
    }

    // Store new data
    leaderboardCache.value[cacheKey] = JSON.stringify(newData)

    // If no previous data, just cache it and skip notification (first load)
    if (!oldData) {
      return
    }

    // Parse old data and compare
    const oldDataParsed = JSON.parse(oldData)

    // Check if top 3 positions changed
    const hasChanges = hasLeaderboardChanged(oldDataParsed, newData)

    if (hasChanges) {
      notifyLeaderboardChange(config, newData, oldDataParsed)
    }
  }

  // Helper function to detect meaningful changes in top 3
  const hasLeaderboardChanged = (oldData, newData) => {
    // Only check top 3 usernames for changes
    const checkLimit = 3

    for (let i = 0; i < checkLimit; i++) {
      // If we don't have enough data, skip
      if (i >= oldData.length || i >= newData.length) {
        return false
      }

      const oldPlayer = oldData[i]
      const newPlayer = newData[i]

      // Only check if username changed (position changed), ignore stat changes
      if (oldPlayer.username !== newPlayer.username) {
        return true
      }
    }

    return false
  }

  // Notify about leaderboard changes using vue-sonner
  const notifyLeaderboardChange = (config, newData, oldData) => {
    const modeLabel = `${config.type === 3 ? 'Bisca 3' : 'Bisca 9'} - ${config.mode === 'S' ? 'Singleplayer' : 'Multiplayer'}`


    // Find which position changed
    let changedMessage = ''
    for (let i = 0; i < 3; i++) {
      if (i >= oldData.length || i >= newData.length) break

      const oldPlayer = oldData[i]
      const newPlayer = newData[i]

      if (oldPlayer.username !== newPlayer.username) {
        const position = i + 1
        const positionLabel = position === 1 ? '🥇 1st' : position === 2 ? '🥈 2nd' : '🥉 3rd'
        changedMessage = `${newPlayer.username} reached ${positionLabel} place!`
        break
      }
    }

    toast.success(changedMessage, {
      description: modeLabel,
      action: {
        label: 'View',
        onClick: () => {
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
