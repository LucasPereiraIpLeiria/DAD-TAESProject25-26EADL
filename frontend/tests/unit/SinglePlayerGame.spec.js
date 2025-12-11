import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reactive } from 'vue'
import { toast } from 'vue-sonner'
import SinglePlayerGame from '@/pages/SinglePlayerGame.vue'

let routeMock
let routerPushMock
let biscaMock
let authMock

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  useRouter: () => ({ push: routerPushMock }),
}))

vi.mock('@/stores/bisca', () => ({
  useBiscaStore: () => biscaMock,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authMock,
}))

vi.mock('vue-sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

const mountPage = async () => {
  const wrapper = mount(SinglePlayerGame, {
    global: {
      stubs: {
        PageContainer: { template: '<div><slot /></div>' },
        UiCard: { template: '<div><slot /></div>' },
        BiscaGameHeader: true,
        BiscaGameInfo: true,
        BiscaGameBoard: { template: '<div />' },
        BiscaEndPanel: { template: '<div />' },
      },
    },
  })

  await flushPromises()
  return wrapper
}

beforeEach(() => {
  routerPushMock = vi.fn()

  if (toast?.error?.mockReset) {
    toast.error.mockReset()
  }

  biscaMock = {
    status: 'in_game',
    phase: 'initial',
    currentTurn: 'player',
    tableCards: { bot: null, player: null },
    playerHand: [],
    startGame: vi.fn(),
    startMatch: vi.fn().mockResolvedValue(undefined),
    resetMatch: vi.fn(),
    playCard: vi.fn(),
    debugWinCapoteGame: vi.fn(),
    debugWinBandeiraGame: vi.fn(),
    debugLoseBandeiraGame: vi.fn(),
    debugDrawGame: vi.fn(),
  }

  authMock = { isLoggedIn: false }

  routeMock = reactive({
    params: { gametype: 'practice', variant: '9' },
    fullPath: '/singleplayer/practice/9',
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('SinglePlayerGame.vue', () => {
  it('inicia um jogo de prática no mounted', async () => {
    await mountPage()

    expect(biscaMock.startGame).toHaveBeenCalledTimes(1)
    expect(biscaMock.startGame).toHaveBeenCalledWith({
      gametype: 'practice',
      variant: '9',
    })
  })

  it('bloqueia match sem login e redireciona para login', async () => {
    routeMock.params.gametype = 'match'
    routeMock.fullPath = '/singleplayer/match/9'
    authMock.isLoggedIn = false

    await mountPage()

    expect(toast.error).toHaveBeenCalledWith(
      'You must be logged in to play a match.'
    )

    expect(routerPushMock).toHaveBeenCalledWith({
      name: 'login',
      query: { redirect: '/singleplayer/match/9' },
    })

    expect(biscaMock.startMatch).not.toHaveBeenCalled()
  })

  it('inicia match com login válido', async () => {
    routeMock.params.gametype = 'match'
    routeMock.fullPath = '/singleplayer/match/9'
    authMock.isLoggedIn = true

    await mountPage()

    expect(biscaMock.startMatch).toHaveBeenCalledTimes(1)
    expect(biscaMock.startMatch).toHaveBeenCalledWith({
      gametype: 'match',
      variant: '9',
    })
  })

  it('erro insufficient_funds no match → mostra toast e volta ao menu', async () => {
    routeMock.params.gametype = 'match'
    routeMock.fullPath = '/singleplayer/match/9'
    authMock.isLoggedIn = true
    biscaMock.startMatch = vi.fn().mockRejectedValue(new Error('insufficient_funds'))

    await mountPage()

    expect(toast.error).toHaveBeenCalledWith(
      'Not enough coins to start this match.'
    )

    expect(routerPushMock).toHaveBeenCalledWith({
      name: 'singleplayer.mode.select',
    })
  })

  it('erro genérico ao iniciar match → fallback e redirect', async () => {
    routeMock.params.gametype = 'match'
    routeMock.fullPath = '/singleplayer/match/9'
    authMock.isLoggedIn = true
    biscaMock.startMatch = vi.fn().mockRejectedValue(new Error('random'))

    await mountPage()

    expect(toast.error).toHaveBeenCalledWith('Unable to start the match.')
    expect(routerPushMock).toHaveBeenCalledWith({
      name: 'singleplayer.mode.select',
    })
  })

  it('resetMatch é chamado antes se status era match_finished', async () => {
    biscaMock.status = 'match_finished'

    await mountPage()

    expect(biscaMock.resetMatch).toHaveBeenCalled()
    expect(biscaMock.startGame).toHaveBeenCalled()
  })

  it('computed isPlayerTurn correto', async () => {
    biscaMock.status = 'in_game'
    biscaMock.currentTurn = 'player'

    const wrapper = await mountPage()
    expect(wrapper.vm.isPlayerTurn).toBe(true)
  })

  it('requiredSuit detecta corretamente o naipe obrigatório', async () => {
    biscaMock.phase = 'final_phase'
    biscaMock.tableCards.bot = { suit: '♠' }
    biscaMock.playerHand = [{ suit: '♠' }]

    const wrapper = await mountPage()

    expect(wrapper.vm.requiredSuit).toBe('♠')
    expect(wrapper.vm.mustFollowSuit).toBe(true)
  })

  it('requiredSuit = null quando jogador não tem o naipe', async () => {
    biscaMock.phase = 'final_phase'
    biscaMock.tableCards.bot = { suit: '♠' }
    biscaMock.playerHand = [{ suit: '♥' }]

    const wrapper = await mountPage()

    expect(wrapper.vm.requiredSuit).toBeNull()
    expect(wrapper.vm.mustFollowSuit).toBe(false)
  })

  it('play ignora jogada se não for a vez do player', async () => {
    biscaMock.currentTurn = 'bot'

    const wrapper = await mountPage()
    await wrapper.vm.play({ id: 1, suit: '♠' })

    expect(biscaMock.playCard).not.toHaveBeenCalled()
  })

  it('play chama playCard imediatamente se não encontrar DOM', async () => {
    vi.spyOn(document, 'querySelector').mockReturnValue(null)

    const wrapper = await mountPage()
    await wrapper.vm.play({ id: 1, suit: '♠' })

    expect(biscaMock.playCard).toHaveBeenCalledWith({ id: 1, suit: '♠' })
  })

  it('nextGame inicia novo jogo quando gametype = match', async () => {
    routeMock.params.gametype = 'match'
    routeMock.params.variant = '9'
    authMock.isLoggedIn = true

    const wrapper = await mountPage()

    biscaMock.startGame.mockClear()

    await wrapper.vm.nextGame()

    expect(biscaMock.startGame).toHaveBeenCalledWith({
      gametype: 'match',
      variant: '9',
    })
    expect(routerPushMock).not.toHaveBeenCalledWith({ name: 'home' })
  })

  it('nextGame redireciona para home em practice', async () => {
    routeMock.params.gametype = 'practice'

    const wrapper = await mountPage()
    await wrapper.vm.nextGame()

    expect(routerPushMock).toHaveBeenCalledWith({ name: 'home' })
  })

  it('exitToSelection → vai para home', async () => {
    const wrapper = await mountPage()
    await wrapper.vm.exitToSelection()

    expect(routerPushMock).toHaveBeenCalledWith({ name: 'home' })
  })

  it('rota muda → reinicia jogo', async () => {
    const wrapper = await mountPage()

    biscaMock.startGame.mockClear()

    routeMock.params.variant = '3'
    await flushPromises()

    expect(biscaMock.startGame).toHaveBeenCalledWith({
      gametype: 'practice',
      variant: '3',
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('debug-win-capote chama debugWinCapoteGame', async () => {
    const wrapper = await mountPage()

    const btn = wrapper.find('#debug-win-capote')
    await btn.trigger('click')

    expect(biscaMock.debugWinCapoteGame).toHaveBeenCalled()
  })

  it('debug-draw chama debugDrawGame', async () => {
    const wrapper = await mountPage()

    const btn = wrapper.find('#debug-draw')
    await btn.trigger('click')

    expect(biscaMock.debugDrawGame).toHaveBeenCalled()
  })
})
