// src/stores/leaderboardMonitor.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

export const useLeaderboardMonitor = defineStore('leaderboardMonitor', () => {
  // Guardamos o líder por VARIANTE (3 e 9) e por tipo de scoreboard
  const cachedLeaders = ref({
    '3': {
      top_matches: null,
      top_achievements: null,
      top_coins: null,
    },
    '9': {
      top_matches: null,
      top_achievements: null,
      top_coins: null,
    },
  })

  let router = null

  const setRouter = (routerInstance) => {
    router = routerInstance
  }

  const ensureBucket = (variant) => {
    const v = String(variant ?? '9')
    if (!cachedLeaders.value[v]) {
      cachedLeaders.value[v] = {
        top_matches: null,
        top_achievements: null,
        top_coins: null,
      }
    }
    return cachedLeaders.value[v]
  }

  /**
   * Recebe o payload de /users/stats/global (ou /scoreboards/global)
   * + a variante (3 | 9) a que diz respeito.
   *
   * checkForChanges(scoreboards, '9')
   */
  const checkForChanges = (scoreboards, variant = '9') => {
    if (!scoreboards) return

    const bucket = ensureBucket(variant)

    checkSingleScoreboard(
      bucket,
      'top_matches',
      'Most matches won',
      'Bisca – Global scoreboards',
      scoreboards.top_matches,
      variant,
    )

    checkSingleScoreboard(
      bucket,
      'top_achievements',
      'Most achievements',
      'Bisca – Global scoreboards',
      scoreboards.top_achievements,
      variant,
    )

    checkSingleScoreboard(
      bucket,
      'top_coins',
      'Most coins (theoretical)',
      'Bisca – Global scoreboards',
      scoreboards.top_coins,
      variant,
    )
  }

  /**
   * Compara o líder atual com o líder anterior para UM tipo de scoreboard
   * E UMA variante (3 ou 9). Se mudar, notifica.
   */
  const checkSingleScoreboard = (bucket, key, title, description, list, variant) => {
    if (!Array.isArray(list) || list.length === 0) {
      // Sem dados → limpamos cache dessa variante
      bucket[key] = null
      return
    }

    const newLeader = list[0]
    if (!newLeader) return

    const oldLeader = bucket[key]

    // Primeiro load desta variante: só cache, sem notificar
    if (!oldLeader) {
      bucket[key] = {
        username: newLeader.username,
        user_id: newLeader.user_id ?? newLeader.id ?? null,
      }
      return
    }

    // Se o username do líder mudou nesta variante, notificamos
    if (oldLeader.username !== newLeader.username) {
      bucket[key] = {
        username: newLeader.username,
        user_id: newLeader.user_id ?? newLeader.id ?? null,
      }

      notifyNewLeader(key, newLeader, title, description, variant)
    }
  }

  const notifyNewLeader = (key, leader, title, description, variant) => {
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

    const variantLabel =
      String(variant) === '3'
        ? 'Bisca of 3'
        : 'Bisca of 9'

    const message = `${leader.username} is now #1 in "${scoreboardLabel}" (${variantLabel})!`

    toast.success(message, {
      description,
      action: {
        label: 'View',
        onClick: () => {
          if (!router) return
          // Abre o ecrã relevante: a Home com os scoreboards e a variante certa
          router.push({
            name: 'home',
            query: {
              highlightScoreboard: key,
              variant: String(variant),
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
