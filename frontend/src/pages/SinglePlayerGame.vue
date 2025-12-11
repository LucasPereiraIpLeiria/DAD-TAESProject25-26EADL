<script setup>
import { onMounted, computed, watch, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBiscaStore } from '@/stores/bisca'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'

import PageContainer from '@/components/ui/PageContainer.vue'
import UiCard from '@/components/ui/UiCard.vue'
import BiscaGameHeader from '@/components/bisca/BiscaGameHeader.vue'
import BiscaGameInfo from '@/components/bisca/BiscaGameInfo.vue'
import BiscaGameBoard from '@/components/bisca/BiscaGameBoard.vue'
import BiscaEndPanel from '@/components/bisca/BiscaEndPanel.vue'

const bisca = useBiscaStore()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isInitializingGame = ref(false)

// gametype: 'practice' | 'match'
const gametype = computed(() => {
  const g = route.params.gametype
  return g === 'match' ? 'match' : 'practice'
})

const variant = computed(() => {
  const v = route.params.variant
  return v === '3' || v === '9' ? v : '9'
})

async function startByRoute() {
  const config = {
    gametype: gametype.value,
    variant: variant.value,
  }

  if (bisca.status === 'match_finished' || bisca.status === 'between_games') {
    bisca.resetMatch()
  }

  isInitializingGame.value = true

  try {
    if (gametype.value === 'match') {
      
      if (!auth.isLoggedIn) {
        toast.error('You must be logged in to play a match.')
        router.push({
          name: 'login',
          query: { redirect: route.fullPath },
        })
        return
      }

      try {
        await bisca.startMatch(config)
      } catch (e) {
        const msg = e?.message || ''

        if (msg === 'insufficient_funds') {
          toast.error('Not enough coins to start this match.')
        } else {
          console.error(e)
          toast.error('Unable to start the match.')
        }

        router.push({ name: 'singleplayer.mode.select' })
        return
      }
    } else {
      // PRACTICE: single in-memory game, sem coins
      bisca.startGame(config)
    }
  } finally {
    isInitializingGame.value = false
  }
}


onMounted(() => {
  startByRoute()
})

watch([gametype, variant], () => {
  startByRoute()
})

// Player turn
const isPlayerTurn = computed(
  () => bisca.status === 'in_game' && bisca.currentTurn === 'player'
)

// Required suit in final phase
const requiredSuit = computed(() => {
  if (bisca.phase !== 'final_phase') return null
  const botCard = bisca.tableCards.bot
  if (!botCard) return null
  const leadingSuit = botCard.suit
  const hasSuit = bisca.playerHand.some((c) => c.suit === leadingSuit)
  return hasSuit ? leadingSuit : null
})

const mustFollowSuit = computed(() => requiredSuit.value !== null)

/* ---------- CARD FLOAT ANIMATION ---------- */

const floatingCard = ref(null)

const cardImages = import.meta.glob('/src/assets/images/cards/*.png', {
  eager: true,
  import: 'default',
})

function suitToLetter(suit) {
  switch (suit) {
    case '♥': return 'c'
    case '♦': return 'o'
    case '♠': return 'e'
    case '♣': return 'p'
    default: return ''
  }
}

function getCardImageUrl(card) {
  if (!card) return ''
  const letter = suitToLetter(card.suit)
  if (!letter) return ''
  const key = `/src/assets/images/cards/${letter}${card.rank}.png`
  return cardImages[key] || ''
}

async function play(card) {
  if (!isPlayerTurn.value) return
  if (requiredSuit.value && card.suit !== requiredSuit.value) return

  const handEl = document.querySelector(`#hand-card-${card.id}`)
  const targetEl = document.querySelector('#table-player-slot')

  if (!handEl || !targetEl) {
    bisca.playCard(card)
    return
  }

  const handRect = handEl.getBoundingClientRect()
  const targetRect = targetEl.getBoundingClientRect()
  const imgUrl = getCardImageUrl(card)

  handEl.style.visibility = 'hidden'

  floatingCard.value = {
    card,
    imgUrl,
    style: {
      position: 'fixed',
      top: `${handRect.top}px`,
      left: `${handRect.left}px`,
      width: `${handRect.width}px`,
      height: `${handRect.height}px`,
      transition: 'top 0.25s ease-out, left 0.25s ease-out',
      zIndex: 9999,
      pointerEvents: 'none',
    },
  }

  await nextTick()

  requestAnimationFrame(() => {
    if (!floatingCard.value) return
    floatingCard.value.style.top = `${targetRect.top}px`
    floatingCard.value.style.left = `${targetRect.left}px`
  })

  setTimeout(() => {
    bisca.playCard(card)
    floatingCard.value = null
    handEl.style.visibility = ''
  }, 260)
}

function nextGame() {
  if (gametype.value === 'match') {
    bisca.startGame({
      gametype: 'match',
      variant: variant.value,
    })
    return
  }

  router.push({ name: 'home' })
}

function exitToSelection() {
  router.push({ name: 'home' })
}
</script>

<template>
  <PageContainer max-width="xl">
    <div class="bisca-layout">
      <UiCard padding="md" background="bg-white/90">
        <BiscaGameHeader :gametype="gametype" :variant="variant" />

        <div
          v-if="bisca.status === 'in_game' && !isInitializingGame"
          class="game-main-layout"
        >
          <div class="info-column">
            <BiscaGameInfo :bisca="bisca" :gametype="gametype" />
          </div>
          <div class="board-column">
            <BiscaGameBoard
              :bisca="bisca"
              :is-player-turn="isPlayerTurn"
              :must-follow-suit="mustFollowSuit"
              @play-card="play"
            />
          </div>
        </div>

        <div v-else-if="isInitializingGame" class="game-main-layout loading-state">
          <div class="info-column" />
          <div class="board-column loading-message">
            <p>Preparing game...</p>
          </div>
        </div>

        <div v-else class="game-main-layout">
          <div class="info-column" />
          <div class="board-column" />
        </div>

        <div
          v-if="floatingCard"
          class="floating-card"
          :style="floatingCard.style"
        >
          <img
            :src="floatingCard.imgUrl"
            alt="Floating card"
            class="floating-card-image table-card-bold"
          >
        </div>

        <!-- DEBUG BUTTONS -->
        <div
          v-if="bisca.status === 'in_game'"
        >
          <button id="debug-win-capote" class="debug-btn" @click="bisca.debugWinCapoteGame()">
            [DEBUG] Win (Capote)
          </button>

          <button id="debug-win-bandeira" class="debug-btn" @click="bisca.debugWinBandeiraGame()">
            [DEBUG] Win (Bandeira)
          </button>

          <button id="debug-lose-bandeira" class="debug-btn loss-btn" @click="bisca.debugLoseBandeiraGame()">
            [DEBUG] Lose (Bot Bandeira)
          </button>

          <button id="debug-draw" class="debug-btn" @click="bisca.debugDrawGame()">
            [DEBUG] Draw
          </button>
        </div>

        <BiscaEndPanel
          v-if="
            bisca.status === 'between_games' ||
            bisca.status === 'match_finished'
          "
          :bisca="bisca"
          :gametype="gametype"
          @next-game="nextGame"
          @exit="exitToSelection"
        />
      </UiCard>
    </div>
  </PageContainer>
</template>

<style scoped>
.bisca-layout {
  max-width: 1100px;
  margin: 0 auto;
}

.game-main-layout {
  display: grid;
  grid-template-columns: minmax(120px, 140px) 1fr;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.info-column {
  align-self: stretch;
}

.board-column {
  align-self: stretch;
}

.floating-card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.35);
}

.table-card-bold {
  outline: 2px solid #111827;
}

.loading-state {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-message p {
  color: #6b7280;
  font-size: 0.95rem;
  text-align: center;
}

.debug-btn {
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  background: #eee;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 0.5rem;
}

.debug-btn:hover {
  background: #ddd;
}

.loss-btn {
  background: #ffe5e5;
  border-color: #ffaaaa;
}

.loss-btn:hover {
  background: #ffcccc;
}
</style>
