// src/stores/leaderboardMonitor.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

export const useLeaderboardMonitor = defineStore('leaderboardMonitor', () => {
  // Guardamos apenas o líder atual de cada scoreboard global
  const cachedLeaders = ref({
    top_matches: null,      // { username, user_id? }
    top_achievements: null, // idem
    top_coins: null,        // idem
  })

  let router = null

  const setRouter = (routerInstance) => {
    router = routerInstance
  }

  /**
   * Recebe o payload completo de /scoreboards/global:
   * {
   *   top_matches: [...],
   *   top_achievements: [...],
   *   top_coins: [...]
   * }
   */
  const checkForChanges = (scoreboards) => {
    if (!scoreboards) return

    checkSingleScoreboard(
      'top_matches',
      'Most matches won',
      'Bisca – Global scoreboards',
      scoreboards.top_matches,
    )

    checkSingleScoreboard(
      'top_achievements',
      'Most achievements',
      'Bisca – Global scoreboards',
      scoreboards.top_achievements,
    )

    checkSingleScoreboard(
      'top_coins',
      'Most coins (theoretical)',
      'Bisca – Global scoreboards',
      scoreboards.top_coins,
    )
  }

  /**
   * Compara o líder atual com o líder anterior para um tipo de scoreboard.
   * Se o username do #1 mudar, dispara notificação.
   */
  const checkSingleScoreboard = (key, title, description, list) => {
    if (!Array.isArray(list) || list.length === 0) {
      // Sem dados → só limpamos cache e não notificamos
      cachedLeaders.value[key] = null
      return
    }

    const newLeader = list[0]
    if (!newLeader) return

    const oldLeader = cachedLeaders.value[key]

    // Primeiro load: só cache, sem notificação
    if (!oldLeader) {
      cachedLeaders.value[key] = {
        username: newLeader.username,
        user_id: newLeader.user_id ?? newLeader.id ?? null,
      }
      return
    }

    // Se o username do líder mudou, notificamos
    if (oldLeader.username !== newLeader.username) {
      cachedLeaders.value[key] = {
        username: newLeader.username,
        user_id: newLeader.user_id ?? newLeader.id ?? null,
      }

      notifyNewLeader(key, newLeader, title, description)
    }
  }

  const notifyNewLeader = (key, leader, title, description) => {
    const scoreboardLabel = (() => {
      switch (key) {
        case 'top_matches':
          return 'Most matches won'
        case 'top_achievements':
          return 'Most achievements'
        case 'top_coins':
          return 'Most coins'
        default:
          return 'Global scoreboards'
      }
    })()

    const message = `${leader.username} is now #1 in "${scoreboardLabel}"!`

    toast.success(message, {
      description,
      action: {
        label: 'View',
        onClick: () => {
          if (!router) return
          // Abre o ecrã relevante: a Home com os scoreboards
          router.push({
            name: 'home',
            query: {
              highlightScoreboard: key, // se quiseres usar isto para dar scroll ou highlight
            },
          })
        },
      },
    })
  }

  return {
    cachedLeaders,
    setRouter,
    checkForChanges,
  }
})
