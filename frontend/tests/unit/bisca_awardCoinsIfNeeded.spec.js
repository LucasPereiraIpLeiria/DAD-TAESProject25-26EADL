import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mocks hoisted para evitar "Cannot access X before initialization"
const authStoreMock = vi.hoisted(() => ({
  isLoggedIn: true,
  refreshUser: vi.fn(),
}))

const apiStoreMock = vi.hoisted(() => ({
  postAwardMatchReward: vi.fn(),
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

describe('awardCoinsIfNeeded', () => {
  let bisca

  beforeEach(() => {
    setActivePinia(createPinia())
    bisca = useBiscaStore()

    // reset mocks
    authStoreMock.isLoggedIn = true
    authStoreMock.refreshUser = vi.fn()
    apiStoreMock.postAwardMatchReward = vi.fn()
  })

  it('não chama API se o utilizador não estiver autenticado', async () => {
    authStoreMock.isLoggedIn = false
    bisca.mode = 'competitive'
    bisca.summary = {
      result: 'win',
      mode: 'competitive',
      gameType: 'match',
      variant: '9',
      playerMarks: 4,
      botMarks: 0,
      playerPoints: 100,
      botPoints: 20,
      achievements: { capote: false, bandeira: false },
    }

    await bisca.awardCoinsIfNeeded()

    expect(apiStoreMock.postAwardMatchReward).not.toHaveBeenCalled()
    expect(authStoreMock.refreshUser).not.toHaveBeenCalled()
  })

  it('não chama API se o modo não for competitivo', async () => {
    authStoreMock.isLoggedIn = true
    bisca.mode = 'practice'
    const originalSummary = {
      result: 'win',
      mode: 'practice',
      gameType: 'match',
      variant: '9',
      playerMarks: 4,
      botMarks: 0,
      playerPoints: 100,
      botPoints: 20,
      achievements: { capote: false, bandeira: false },
    }
    bisca.summary = originalSummary

    await bisca.awardCoinsIfNeeded()

    expect(apiStoreMock.postAwardMatchReward).not.toHaveBeenCalled()
    expect(authStoreMock.refreshUser).not.toHaveBeenCalled()
    // early return → summary não é alterado
    expect(bisca.summary).toMatchObject(originalSummary)

  })

  it('não chama API se não houver summary', async () => {
    authStoreMock.isLoggedIn = true
    bisca.mode = 'competitive'
    bisca.summary = null

    await bisca.awardCoinsIfNeeded()

    expect(apiStoreMock.postAwardMatchReward).not.toHaveBeenCalled()
    expect(authStoreMock.refreshUser).not.toHaveBeenCalled()
  })

  it('não chama API se o resultado não for vitória', async () => {
    authStoreMock.isLoggedIn = true
    bisca.mode = 'competitive'
    bisca.summary = {
      result: 'loss',
      mode: 'competitive',
      gameType: 'match',
      variant: '9',
      playerMarks: 1,
      botMarks: 4,
      playerPoints: 40,
      botPoints: 90,
      achievements: { capote: false, bandeira: false },
    }

    await bisca.awardCoinsIfNeeded()

    expect(apiStoreMock.postAwardMatchReward).not.toHaveBeenCalled()
    expect(authStoreMock.refreshUser).not.toHaveBeenCalled()
  })

  it('chama API com o payload certo e atualiza summary e user (coins em meta.coins_awarded)', async () => {
    authStoreMock.isLoggedIn = true
    bisca.mode = 'competitive'
    bisca.gameType = 'match'

    bisca.summary = {
      result: 'win',
      mode: 'competitive',
      gameType: 'match',
      variant: '9',
      playerMarks: 4,
      botMarks: 0,
      playerPoints: 100,
      botPoints: 20,
      achievements: { capote: true, bandeira: false },
    }

    apiStoreMock.postAwardMatchReward.mockResolvedValueOnce({
      data: {
        meta: {
          coins_awarded: 42,
        },
      },
    })
    authStoreMock.refreshUser.mockResolvedValueOnce()

    await bisca.awardCoinsIfNeeded()

    expect(apiStoreMock.postAwardMatchReward).toHaveBeenCalledTimes(1)
    const payload = apiStoreMock.postAwardMatchReward.mock.calls[0][0]

    expect(payload).toMatchObject({
      result: 'win',
      mode: 'competitive',
      gametype: 'match',
      variant: '9',
      player_marks: 4,
      bot_marks: 0,
      player_points: 100,
      bot_points: 20,
      capote: true,
      bandeira: false,
    })

    expect(authStoreMock.refreshUser).toHaveBeenCalledTimes(1)
    expect(bisca.summary.coinsAwarded).toBe(42)
  })

  it('usa data.coins_awarded se meta.coins_awarded não existir', async () => {
    authStoreMock.isLoggedIn = true
    bisca.mode = 'competitive'
    bisca.gameType = 'standalone'

    bisca.summary = {
      result: 'win',
      mode: 'competitive',
      gameType: 'standalone',
      variant: '3',
      playerMarks: 4,
      botMarks: 0,
      playerPoints: 120,
      botPoints: 0,
      achievements: { capote: false, bandeira: true },
    }

    apiStoreMock.postAwardMatchReward.mockResolvedValueOnce({
      data: {
        coins_awarded: 10,
      },
    })
    authStoreMock.refreshUser.mockResolvedValueOnce()

    await bisca.awardCoinsIfNeeded()

    expect(apiStoreMock.postAwardMatchReward).toHaveBeenCalledTimes(1)
    expect(authStoreMock.refreshUser).toHaveBeenCalledTimes(1)
    expect(bisca.summary.coinsAwarded).toBe(10)
  })

  it('não adiciona coinsAwarded se o backend não devolver coins', async () => {
    authStoreMock.isLoggedIn = true
    bisca.mode = 'competitive'
    bisca.gameType = 'match'

    const baseSummary = {
      result: 'win',
      mode: 'competitive',
      gameType: 'match',
      variant: '9',
      playerMarks: 4,
      botMarks: 0,
      playerPoints: 100,
      botPoints: 20,
      achievements: { capote: false, bandeira: false },
    }
    bisca.summary = { ...baseSummary }

    apiStoreMock.postAwardMatchReward.mockResolvedValueOnce({
      data: {}, // sem meta.coins_awarded nem coins_awarded
    })
    authStoreMock.refreshUser.mockResolvedValueOnce()

    await bisca.awardCoinsIfNeeded()

    expect(apiStoreMock.postAwardMatchReward).toHaveBeenCalledTimes(1)
    expect(authStoreMock.refreshUser).toHaveBeenCalledTimes(1)

    // summary foi eventualmente reatribuído, mas sem coinsAwarded
    expect(bisca.summary).toMatchObject(baseSummary)
    expect(bisca.summary.coinsAwarded).toBeUndefined()
  })

  it('em caso de erro na API, não lança exceção e não chama refreshUser', async () => {
    authStoreMock.isLoggedIn = true
    bisca.mode = 'competitive'
    bisca.gameType = 'match'

    const originalSummary = {
      result: 'win',
      mode: 'competitive',
      gameType: 'match',
      variant: '9',
      playerMarks: 4,
      botMarks: 0,
      playerPoints: 100,
      botPoints: 20,
      achievements: { capote: false, bandeira: false },
    }
    bisca.summary = { ...originalSummary }

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    apiStoreMock.postAwardMatchReward.mockRejectedValueOnce(new Error('network error'))

    await expect(bisca.awardCoinsIfNeeded()).resolves.toBeUndefined()

    expect(apiStoreMock.postAwardMatchReward).toHaveBeenCalledTimes(1)
    expect(authStoreMock.refreshUser).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()

    // summary não deve ganhar coinsAwarded
    expect(bisca.summary).toMatchObject(originalSummary)
    expect(bisca.summary.coinsAwarded).toBeUndefined()

    consoleErrorSpy.mockRestore()
  })

  it('usa gameType da store se summary.gameType estiver undefined', async () => {
    authStoreMock.isLoggedIn = true
    bisca.mode = 'competitive'
    bisca.gameType = 'standalone' // fallback

    bisca.summary = {
      result: 'win',
      mode: 'competitive',
      gameType: undefined,
      variant: '3',
      playerMarks: 4,
      botMarks: 0,
      playerPoints: 80,
      botPoints: 20,
      achievements: { capote: false, bandeira: false },
    }

    apiStoreMock.postAwardMatchReward.mockResolvedValueOnce({
      data: {
        coins_awarded: 5,
      },
    })
    authStoreMock.refreshUser.mockResolvedValueOnce()

    await bisca.awardCoinsIfNeeded()

    expect(apiStoreMock.postAwardMatchReward).toHaveBeenCalledTimes(1)
    const payload = apiStoreMock.postAwardMatchReward.mock.calls[0][0]

    expect(payload.gametype).toBe('standalone')
    expect(bisca.summary.coinsAwarded).toBe(5)
  })
})
