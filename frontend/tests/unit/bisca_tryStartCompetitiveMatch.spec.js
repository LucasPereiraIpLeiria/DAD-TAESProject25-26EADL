import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Cria mocks hoisted
const authStoreMock = vi.hoisted(() => ({
  isLoggedIn: true,
  refreshUser: vi.fn(),
}))

const apiStoreMock = vi.hoisted(() => ({
  postDeductEntryFee: vi.fn(),
}))

// Mock das stores para devolverem SEMPRE estes objetos
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

// IMPORTA a store DEPOIS dos mocks
import { useBiscaStore } from '@/stores/bisca'

describe('tryStartCompetitiveMatch', () => {
  let bisca

  beforeEach(() => {
    setActivePinia(createPinia())
    bisca = useBiscaStore()

    // reset aos mocks antes de cada teste
    authStoreMock.isLoggedIn = true
    authStoreMock.refreshUser = vi.fn()

    apiStoreMock.postDeductEntryFee = vi.fn()
  })

  it('retorna ok=true quando o débito corre bem', async () => {
    apiStoreMock.postDeductEntryFee.mockResolvedValueOnce({})
    authStoreMock.refreshUser.mockResolvedValueOnce()

    const result = await bisca.tryStartCompetitiveMatch()

    expect(result).toEqual({ ok: true })
    expect(apiStoreMock.postDeductEntryFee).toHaveBeenCalledTimes(1)
    expect(authStoreMock.refreshUser).toHaveBeenCalledTimes(1)
  })

  it('retorna not_authenticated se o user não estiver logado', async () => {
    authStoreMock.isLoggedIn = false

    const result = await bisca.tryStartCompetitiveMatch()

    expect(result).toEqual({ ok: false, reason: 'not_authenticated' })
    expect(apiStoreMock.postDeductEntryFee).not.toHaveBeenCalled()
    expect(authStoreMock.refreshUser).not.toHaveBeenCalled()
  })

  it('retorna insufficient_funds quando o backend devolve esse erro', async () => {
    apiStoreMock.postDeductEntryFee.mockRejectedValueOnce({
      response: {
        data: { reason: 'insufficient_funds' },
      },
    })

    const result = await bisca.tryStartCompetitiveMatch()

    expect(result).toEqual({ ok: false, reason: 'insufficient_funds' })
    expect(apiStoreMock.postDeductEntryFee).toHaveBeenCalledTimes(1)
    expect(authStoreMock.refreshUser).not.toHaveBeenCalled()
  })

  it('retorna unknown_error quando o backend falha de outra forma', async () => {
    apiStoreMock.postDeductEntryFee.mockRejectedValueOnce({
      response: {
        data: { reason: 'some_other_error' },
      },
    })

    const result = await bisca.tryStartCompetitiveMatch()

    expect(result).toEqual({ ok: false, reason: 'unknown_error' })
    expect(apiStoreMock.postDeductEntryFee).toHaveBeenCalledTimes(1)
    expect(authStoreMock.refreshUser).not.toHaveBeenCalled()
  })
})
