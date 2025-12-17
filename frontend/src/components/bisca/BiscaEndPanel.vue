<script setup>
import { watch, ref } from 'vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import confetti from 'canvas-confetti'
import confettiSound from '@/assets/sounds/confetti.mp3'
import victorySound from '@/assets/sounds/victory.mp3'

const props = defineProps({
  bisca: {
    type: Object,
    required: true,
  },
  gametype: {
    type: String,
    required: true, // 'practice' | 'match'
  },
})

const emit = defineEmits(['next-game', 'exit'])

const hasCelebrated = ref(false)

function playConfettiSound() {
  const audio = new Audio(confettiSound)
  audio.volume = 0.6    
  audio.play().catch(err => {
    console.warn("Som bloqueado até interação do utilizador:", err)
  })
}

function playVictorySound() {
  const audio = new Audio(victorySound)
  audio.volume = 0.6    
  audio.play().catch(err => {
    console.warn("Som bloqueado até interação do utilizador:", err)
  })
}

function launchConfettiBurst() {

  playConfettiSound()
  playVictorySound()

  const delay = 300

  setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.8 },
      scalar: 0.9,
    })

    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        scalar: 0.8,
      })
    }, 350)
  }, delay)
}

function handleNextGame() {
  emit('next-game')
}

function handleExit() {
  emit('exit')
}


watch(
  () => props.bisca.summary?.coinsAwarded,
  (newCoins, oldCoins) => {

    if (hasCelebrated.value) return

    const summary = props.bisca.summary
    if (!summary) return

    if (props.gametype !== 'match' && summary.gameType !== 'match') return

    if (summary.result !== 'win') return

    if (newCoins == null || newCoins <= 0) return

    hasCelebrated.value = true
    launchConfettiBurst()
  }
)

</script>

<template>
  <!-- End of a game (match not finished yet) -->
  <section
    v-if="bisca.status === 'between_games'"
    class="end-panel"
  >
    <h2>Game Finished</h2>

    <p>Points this game: {{ bisca.playerPoints }} - {{ bisca.botPoints }}</p>
    <p>Marks: {{ bisca.playerMarks }} - {{ bisca.botMarks }}</p>

    <PrimaryButton type="button" @click="handleNextGame">
      Start Next Game
    </PrimaryButton>
  </section>

  <!-- End of a match or practice game -->
  <section
    v-else-if="bisca.status === 'match_finished' && bisca.summary"
    class="end-panel"
  >
    <h2>{{ gametype === 'match' ? 'Match Finished' : 'Game Finished' }}</h2>

    <p class="end-result">
      <strong>Result:</strong>
      {{
        bisca.summary.result === 'win'
          ? 'Victory'
          : bisca.summary.result === 'loss'
            ? 'Defeat'
            : 'Draw'
      }}
    </p>

    <!-- MATCH: marks + total points -->
    <template v-if="gametype === 'match'">
      <p>
        <strong>Marks:</strong>
        {{ bisca.summary.playerMarks }} - {{ bisca.summary.botMarks }}
      </p>
      <p>
        <strong>Total match points:</strong>
        {{ bisca.matchPlayer1Points }} - {{ bisca.matchPlayer2Points }}
      </p>
    </template>

    <!-- PRACTICE: only game points -->
    <template v-else>
      <p>
        <strong>Points:</strong>
        {{ bisca.summary.playerPoints }} - {{ bisca.summary.botPoints }}
      </p>
    </template>

    <p
      v-if="bisca.summary.result === 'win' && bisca.summary.coinsAwarded != null"
      class="coins-awarded"
    >
      <strong>Coins earned:</strong> +{{ bisca.summary.coinsAwarded }} !!
    </p>

    <!-- Match games breakdown -->
    <div
      v-if="gametype === 'match' && bisca.matchGames && bisca.matchGames.length"
      class="games-list"
    >
      <h3>Game Results</h3>
      <ul>
        <li
          v-for="g in bisca.matchGames"
          :key="g.gameNumber"
        >
          <span class="game-label">Game {{ g.gameNumber }}:</span>
          <span class="game-score">
            {{ g.playerPoints }} - {{ g.botPoints }}
          </span>
          <span class="game-result">
            ·
            {{
              g.winner === 'player'
                ? 'Victory'
                : g.winner === 'bot'
                  ? 'Defeat'
                  : 'Draw'
            }}
          </span>

          <span
            v-if="g.achievements?.bandeira"
            class="px-1.5 py-0.5 rounded-full border border-indigo-200 font-bold bg-indigo-50 text-indigo-700 text-[11px] sm:text-xs whitespace-nowrap"
          >
            Bandeira
          </span>
          <span
            v-else-if="g.achievements?.capote"
            class="px-1.5 py-0.5 rounded-full border border-purple-200 font-bold bg-purple-50 text-purple-700 text-[11px] sm:text-xs whitespace-nowrap"
          >
            Capote
          </span>
        </li>
      </ul>
    </div>

    <PrimaryButton type="button" @click="handleExit">
      Back to Dashboard
    </PrimaryButton>
  </section>
</template>

<style scoped>
.coins-awarded {
  margin-top: 0.6rem;
  padding: 0.35rem 0.6rem;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  display: inline-block;
}

.end-panel {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.end-panel h2 {
  margin: 0 0 0.4rem;
  font-size: 1.1rem;
}

.end-panel p {
  margin: 0.15rem 0;
  font-size: 0.9rem;
}

.end-result {
  margin-top: 0.4rem;
}

.games-list {
  margin-top: 0.75rem;
  text-align: left;
}

.games-list h3 {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
}

.games-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.games-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  padding: 0.15rem 0;
}

.game-label {
  font-weight: 600;
}

.game-score {
  font-variant-numeric: tabular-nums;
}

.game-result {
  opacity: 0.8;
}

.badge {
  padding: 0.1rem 0.35rem;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  font-size: 0.75rem;
}
</style>
