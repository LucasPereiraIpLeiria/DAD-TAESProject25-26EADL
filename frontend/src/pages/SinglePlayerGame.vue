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

const isInitializingGame = ref(false)


const mode = computed(() => {
  const m = route.params.mode
  return (m === 'competitive' || m === 'practice') ? m : 'practice'
})

const gametype = computed(() => {
  const g = route.params.gametype
  return (g === 'standalone' || g === 'match') ? g : 'standalone'
})

const variant = computed(() => {
  const v = route.params.variant
  return (v === '3' || v === '9') ? v : '9'
})

async function startByRoute() {
  const config = {
    mode: mode.value,
    gametype: gametype.value,
    variant: variant.value,
  }

  if (bisca.status === 'match_finished' || bisca.status === 'between_games') {
    bisca.resetMatch()
  }

  // 👉 começa o "loading" do jogo
  isInitializingGame.value = true

  try {
    // Se for competitivo, cobra SEMPRE ao entrar na página
    if (mode.value === 'competitive') {
      const result = await bisca.tryStartCompetitiveMatch({ gametype: gametype.value })

      if (!result.ok) {
        if (result.reason === 'not_authenticated') {
          toast.error('Precisas de estar autenticado para jogar competitivo.')
          router.push({ name: 'login', query: { redirect: route.fullPath } })
        } else if (result.reason === 'insufficient_funds') {
          toast.error('Não tens coins suficientes para começar este jogo.')
          router.push({ name: 'singleplayer.mode.select' })
        } else {
          toast.error('Não foi possível iniciar o jogo competitivo.')
          router.push({ name: 'singleplayer.mode.select' })
        }
        return
      }
    }

    // Aqui já está pago (ou é practice) → arranca jogo novo
    if (gametype.value === 'match') {
      await bisca.startMatch(config)
    } else {
      bisca.startGame(config)
    }
  } finally {
    // 👉 só aqui libertamos o loading, depois do baralho estar criado
    isInitializingGame.value = false
  }
}

onMounted(() => {
  startByRoute()
})

watch([mode, gametype, variant], () => {
  startByRoute()
})

const isPlayerTurn = computed(
  () => bisca.status === 'in_game' && bisca.currentTurn === 'player',
)

// Naipe que sou obrigado a seguir na fase final (se existir)
const requiredSuit = computed(() => {
  // Só na fase final
  if (bisca.phase !== 'final_phase') return null

  // Só quando estou a responder à carta do bot
  const botCard = bisca.tableCards.bot
  if (!botCard) return null

  const leadingSuit = botCard.suit
  const hasSuit = bisca.playerHand.some((c) => c.suit === leadingSuit)

  return hasSuit ? leadingSuit : null
})

// Flag para UI: estou obrigado a assistir?
const mustFollowSuit = computed(() => requiredSuit.value !== null)

/* ---------- ANIMAÇÃO DA CARTA A IR PARA O BOARD ---------- */

const floatingCard = ref(null) // { card, style, imgUrl }

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

  // ⛔ BLOQUEIA jogada ilegal na fase final (não assiste ao naipe)
  if (requiredSuit.value && card.suit !== requiredSuit.value) {
    // Não animamos, não chamamos playCard, não mexemos em nada
    // A UI vai mostrar "Obrigado a assistir" via mustFollowSuit
    return
  }

  const handEl = document.querySelector(`#hand-card-${card.id}`)
  const targetEl = document.querySelector('#table-player-slot')

  // fallback se algo falhar
  if (!handEl || !targetEl) {
    bisca.playCard(card)
    return
  }

  const handRect = handEl.getBoundingClientRect()
  const targetRect = targetEl.getBoundingClientRect()
  const imgUrl = getCardImageUrl(card)

  // 1) Esconde a carta verdadeira da mão
  handEl.style.visibility = 'hidden'

  // 2) Carta flutuante
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

  // 3) Animar até ao slot
  requestAnimationFrame(() => {
    if (!floatingCard.value) return
    floatingCard.value.style.top = `${targetRect.top}px`
    floatingCard.value.style.left = `${targetRect.left}px`
  })

  // 4) No fim da animação é que aplicamos a jogada
  setTimeout(() => {
    bisca.playCard(card)
    floatingCard.value = null

    if (handEl) {
      handEl.style.visibility = ''
    }
  }, 260)
}



function nextGame() {
  if (gametype.value === 'match') {
    bisca.startGame({
      mode: mode.value,
      gametype: gametype.value,
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
      <UiCard padding="md">
        <BiscaGameHeader :mode="mode" :gametype="gametype" :variant="variant" />

        <!-- Info à esquerda + Gameboard à direita -->
        <div v-if="bisca.status === 'in_game' && !isInitializingGame" class="game-main-layout">
          <div class="info-column">
            <BiscaGameInfo :bisca="bisca" :gametype="gametype" />
          </div>

          <div class="board-column">
            <BiscaGameBoard :bisca="bisca" :is-player-turn="isPlayerTurn" :must-follow-suit="mustFollowSuit"
              @play-card="play" />
          </div>
        </div>

        <!-- Estado de “a preparar jogo” (apenas enquanto está a inicializar) -->
        <div v-else-if="isInitializingGame" class="game-main-layout loading-state">
          <div class="info-column" />
          <div class="board-column loading-message">
            <p>Preparing game...</p>
          </div>
        </div>

        <!-- Qualquer outro estado (between_games, match_finished, etc.) não mostra board nem loading -->
        <div v-else class="game-main-layout">
          <div class="info-column" />
          <div class="board-column" />
        </div>

        <!-- Carta flutuante animada -->
        <div v-if="floatingCard" class="floating-card" :style="floatingCard.style">
          <img :src="floatingCard.imgUrl" alt="Carta a ser jogada" class="floating-card-image table-card-bold">
        </div>

        <div v-if="bisca.status === 'in_game' && bisca.status !== 'between_games'">
          <button id="debug-end-any" class="debug-btn" @click="bisca.debugForceEnd()">
            [DEBUG] Terminar instantaneamente
          </button>
        </div>

        <BiscaEndPanel v-if="bisca.status === 'between_games' || bisca.status === 'match_finished'" :bisca="bisca"
          :gametype="gametype" @next-game="nextGame" @exit="exitToSelection" />
      </UiCard>
    </div>
  </PageContainer>
</template>

<style scoped>
.bisca-layout {
  max-width: 1100px;
  margin: 0 auto;
}

/* info à esquerda, board à direita */
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
</style>
