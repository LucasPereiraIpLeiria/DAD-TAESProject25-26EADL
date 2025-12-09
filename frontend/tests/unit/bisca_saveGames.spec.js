import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mocks hoisted para evitar "Cannot access X before initialization"
const authStoreMock = vi.hoisted(() => ({
  isLoggedIn: true,
  refreshUser: vi.fn(),
  currentUser: { id: 123 }, // p1
}))

const apiStoreMock = vi.hoisted(() => ({
  postStandalone: vi.fn(),
  postGame: vi.fn(),
}))

vi.mock('@/stores/auth', () => {
  return {
    useAuthStore: () => authStoreMock,
  }
})

vi.mock('@/stores/api', () => {
  return {
    useAPIStore: () => apiStoreMock,
  }
})

// IMPORTA a store depois dos mocks
import { useBiscaStore } from '@/stores/bisca'

describe('saveStandaloneGame', () => {
  let bisca

  beforeEach(() => {
    setActivePinia(createPinia())
    bisca = useBiscaStore()

    // reset mocks
    authStoreMock.currentUser = { id: 123 }
    apiStoreMock.postStandalone = vi.fn()
  })

  it('não chama API se o modo não for competitivo', async () => {
    bisca.mode = 'practice'

    const summary = {
      gameType: 'standalone',
      playerPoints: 100,
      botPoints: 20,
    }

    await bisca.saveStandaloneGame(summary)

    expect(apiStoreMock.postStandalone).not.toHaveBeenCalled()
  })

  it('não chama API se o gameType não for standalone', async () => {
    bisca.mode = 'competitive'

    const summary = {
      gameType: 'match',
      playerPoints: 100,
      botPoints: 20,
    }

    await bisca.saveStandaloneGame(summary)

    expect(apiStoreMock.postStandalone).not.toHaveBeenCalled()
  })

  it('envia payload correto numa vitória do player', async () => {
    bisca.mode = 'competitive'
    bisca.variant = '9'
    bisca.beganAt = '2025-01-01T10:00:00.000Z'
    bisca.endedAt = '2025-01-01T10:10:00.000Z'

    authStoreMock.currentUser = { id: 999 } // p1

    const summary = {
      gameType: 'standalone',
      playerPoints: 80,
      botPoints: 40,
    }

    await bisca.saveStandaloneGame(summary)

    expect(apiStoreMock.postStandalone).toHaveBeenCalledTimes(1)
    const payload = apiStoreMock.postStandalone.mock.calls[0][0]

    expect(payload).toMatchObject({
      player1_user_id: 999,
      player2_user_id: 521,
      type: '9',
      status: 'Ended',
      is_draw: false,
      winner_user_id: 999,
      loser_user_id: 521,
      player1_points: 80,
      player2_points: 40,
      began_at: '2025-01-01T10:00:00.000Z',
      ended_at: '2025-01-01T10:10:00.000Z',
      match_id: null,
    })
  })

  it('envia payload correto numa derrota do player', async () => {
    bisca.mode = 'competitive'
    bisca.variant = '3'
    bisca.beganAt = '2025-02-02T09:00:00.000Z'
    bisca.endedAt = '2025-02-02T09:05:00.000Z'

    authStoreMock.currentUser = { id: 50 } // p1

    const summary = {
      gameType: 'standalone',
      playerPoints: 30,
      botPoints: 90,
    }

    await bisca.saveStandaloneGame(summary)

    expect(apiStoreMock.postStandalone).toHaveBeenCalledTimes(1)
    const payload = apiStoreMock.postStandalone.mock.calls[0][0]

    expect(payload).toMatchObject({
      player1_user_id: 50,
      player2_user_id: 521,
      type: '3',
      status: 'Ended',
      is_draw: false,
      winner_user_id: 521,
      loser_user_id: 50,
      player1_points: 30,
      player2_points: 90,
      began_at: '2025-02-02T09:00:00.000Z',
      ended_at: '2025-02-02T09:05:00.000Z',
      match_id: null,
    })
  })

  it('envia payload correto num empate (is_draw=true, winner/loser null)', async () => {
    bisca.mode = 'competitive'
    bisca.variant = '9'
    bisca.beganAt = '2025-03-03T12:00:00.000Z'
    bisca.endedAt = '2025-03-03T12:07:00.000Z'

    authStoreMock.currentUser = { id: 777 }

    const summary = {
      gameType: 'standalone',
      playerPoints: 60,
      botPoints: 60,
    }

    await bisca.saveStandaloneGame(summary)

    expect(apiStoreMock.postStandalone).toHaveBeenCalledTimes(1)
    const payload = apiStoreMock.postStandalone.mock.calls[0][0]

    expect(payload).toMatchObject({
      player1_user_id: 777,
      player2_user_id: 521,
      is_draw: true,
      winner_user_id: null,
      loser_user_id: null,
      player1_points: 60,
      player2_points: 60,
      began_at: '2025-03-03T12:00:00.000Z',
      ended_at: '2025-03-03T12:07:00.000Z',
    })
  })
})

describe('saveMatchGame', () => {
  let bisca

  beforeEach(() => {
    setActivePinia(createPinia())
    bisca = useBiscaStore()

    authStoreMock.currentUser = { id: 123 }
    apiStoreMock.postGame = vi.fn()
  })

  it('não chama API se o modo não for competitivo', async () => {
    bisca.mode = 'practice'
    bisca.gameType = 'match'
    bisca.currentMatchId = 10

    bisca.playerPoints = 80
    bisca.botPoints = 40

    await bisca.saveMatchGame('player')

    expect(apiStoreMock.postGame).not.toHaveBeenCalled()
  })

  it('não chama API se gameType não for match', async () => {
    bisca.mode = 'competitive'
    bisca.gameType = 'standalone'
    bisca.currentMatchId = 10

    bisca.playerPoints = 80
    bisca.botPoints = 40

    await bisca.saveMatchGame('player')

    expect(apiStoreMock.postGame).not.toHaveBeenCalled()
  })

  it('não chama API se não houver currentMatchId', async () => {
    bisca.mode = 'competitive'
    bisca.gameType = 'match'
    bisca.currentMatchId = null

    bisca.playerPoints = 80
    bisca.botPoints = 40

    await bisca.saveMatchGame('player')

    expect(apiStoreMock.postGame).not.toHaveBeenCalled()
  })

  it('envia payload correto quando o player ganha', async () => {
    bisca.mode = 'competitive'
    bisca.gameType = 'match'
    bisca.currentMatchId = 55
    bisca.variant = '9'
    bisca.beganAt = '2025-04-04T15:00:00.000Z'
    bisca.endedAt = '2025-04-04T15:12:00.000Z'

    bisca.playerPoints = 92
    bisca.botPoints = 40

    authStoreMock.currentUser = { id: 321 } // p1

    await bisca.saveMatchGame('player')

    expect(apiStoreMock.postGame).toHaveBeenCalledTimes(1)
    const payload = apiStoreMock.postGame.mock.calls[0][0]

    expect(payload).toMatchObject({
      type: '9',
      player1_user_id: 321,
      player2_user_id: 521,
      is_draw: false,
      winner_user_id: 321,
      loser_user_id: 521,
      match_id: 55,
      status: 'Ended',
      began_at: '2025-04-04T15:00:00.000Z',
      ended_at: '2025-04-04T15:12:00.000Z',
      player1_points: 92,
      player2_points: 40,
    })
  })

  it('envia payload correto quando o bot ganha', async () => {
    bisca.mode = 'competitive'
    bisca.gameType = 'match'
    bisca.currentMatchId = 99
    bisca.variant = '3'
    bisca.beganAt = '2025-05-05T18:00:00.000Z'
    bisca.endedAt = '2025-05-05T18:08:00.000Z'

    bisca.playerPoints = 30
    bisca.botPoints = 80

    authStoreMock.currentUser = { id: 111 } // p1

    await bisca.saveMatchGame('bot')

    expect(apiStoreMock.postGame).toHaveBeenCalledTimes(1)
    const payload = apiStoreMock.postGame.mock.calls[0][0]

    expect(payload).toMatchObject({
      type: '3',
      player1_user_id: 111,
      player2_user_id: 521,
      is_draw: false,
      winner_user_id: 521,
      loser_user_id: 111,
      match_id: 99,
      status: 'Ended',
      began_at: '2025-05-05T18:00:00.000Z',
      ended_at: '2025-05-05T18:08:00.000Z',
      player1_points: 30,
      player2_points: 80,
    })
  })

  it('envia payload correto num empate (is_draw=true, winner/loser null)', async () => {
    bisca.mode = 'competitive'
    bisca.gameType = 'match'
    bisca.currentMatchId = 77
    bisca.variant = '9'
    bisca.beganAt = '2025-06-06T20:00:00.000Z'
    bisca.endedAt = '2025-06-06T20:09:00.000Z'

    bisca.playerPoints = 60
    bisca.botPoints = 60

    authStoreMock.currentUser = { id: 222 }

    await bisca.saveMatchGame('player') // winner param não interessa, porque é empate

    expect(apiStoreMock.postGame).toHaveBeenCalledTimes(1)
    const payload = apiStoreMock.postGame.mock.calls[0][0]

    expect(payload).toMatchObject({
      player1_user_id: 222,
      player2_user_id: 521,
      is_draw: true,
      winner_user_id: null,
      loser_user_id: null,
      match_id: 77,
      player1_points: 60,
      player2_points: 60,
    })
  })
})
