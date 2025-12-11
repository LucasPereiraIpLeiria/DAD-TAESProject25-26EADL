// tests/unit/api_store.spec.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// ───────────────────────────────────────────────
// MOCKS
// ───────────────────────────────────────────────

// Mock do axios com interceptors manuais
vi.mock('axios', () => {
  const mockAxios = {
    defaults: {
      headers: {
        common: {},
      },
    },
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      response: {
        use: vi.fn((onFulfilled, onRejected) => {
          mockAxios._onFulfilled = onFulfilled
          mockAxios._onRejected = onRejected
        }),
      },
    },
    _onFulfilled: undefined,
    _onRejected: undefined,
  }

  return {
    default: mockAxios,
  }
})

// Mock de vue.inject para devolver um API_BASE_URL fixo
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    inject: (key) => {
      if (key === 'apiBaseURL') return 'http://api.test'
      // fallback: se por acaso outro código usar inject
      return undefined
    },
  }
})

import axios from 'axios'
import { useAPIStore } from '@/stores/api'

// ───────────────────────────────────────────────
// TESTES
// ───────────────────────────────────────────────

describe('API Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    axios.defaults.headers.common = {}

    store = useAPIStore()
  })

  // 1) initializeToken lê do localStorage e configura axios + token
  it('initializeToken lê auth_token do localStorage e configura token + axios header', () => {
    // limpar qualquer estado prévio
    store.clearToken()

    localStorage.setItem('auth_token', 'abc123')

    store.initializeToken()

    expect(store.token).toBe('abc123')
    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer abc123')
  })

  // 2) setToken guarda token, localStorage e header; limpar no setToken(null)
  it('setToken define token, localStorage e Authorization header; limpa no setToken(null)', () => {
    store.setToken('jwt-token')

    expect(store.token).toBe('jwt-token')
    expect(localStorage.getItem('auth_token')).toBe('jwt-token')
    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer jwt-token')

    store.setToken(null)

    expect(store.token).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined()
  })

  // 3) clearToken limpa token, localStorage e header
  it('clearToken limpa token, localStorage e Authorization header', () => {
    store.setToken('something')

    store.clearToken()

    expect(store.token).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined()
  })

  // 4) validateToken devolve true se não houver token ou se já estiver a validar
  it('validateToken devolve true sem chamar axios se não houver token', async () => {
    store.clearToken()
    store.isValidating = false

    const result = await store.validateToken()

    expect(result).toBe(true)
    expect(axios.get).not.toHaveBeenCalled()
  })

  // 5) validateToken com token válido chama /users/me e devolve true
  it('validateToken com token definido chama /users/me e devolve true em sucesso', async () => {
    store.setToken('abc')
    axios.get.mockResolvedValueOnce({ data: { id: 1 } })

    const result = await store.validateToken()

    expect(axios.get).toHaveBeenCalledWith('http://api.test/users/me')
    expect(result).toBe(true)
    expect(store.isValidating).toBe(false)
    expect(store.token).toBe('abc') // mantém token
  })

  // 6) validateToken em erro limpa token e devolve false
  it('validateToken em erro limpa token e devolve false', async () => {
    store.setToken('abc')
    axios.get.mockRejectedValueOnce(new Error('401'))

    const result = await store.validateToken()

    expect(result).toBe(false)
    expect(store.token).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  // 7) postLogin envia pedido para /login, define token e header
  it('postLogin faz POST /login, lê token da resposta e chama setToken', async () => {
    const credentials = { email: 'a@mail.pt', password: '123' }
    axios.post.mockResolvedValueOnce({
      data: { token: 'login-token' },
    })

    const response = await store.postLogin(credentials)

    expect(axios.post).toHaveBeenCalledWith('http://api.test/login', credentials)
    expect(response.data.token).toBe('login-token')
    expect(store.token).toBe('login-token')
    expect(localStorage.getItem('auth_token')).toBe('login-token')
    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer login-token')
  })

  // 8) postLogin sem token na resposta lança erro
  it('postLogin lança erro se resposta não contiver token', async () => {
    const credentials = { email: 'a@mail.pt', password: '123' }
    axios.post.mockResolvedValueOnce({
      data: {},
    })

    await expect(store.postLogin(credentials)).rejects.toThrow('No token returned.')
    expect(store.token).toBeNull()
  })

  // 9) getAuthUser sem token deve lançar erro
  it('getAuthUser lança erro se não houver token', async () => {
    store.clearToken()

    await expect(store.getAuthUser()).rejects.toThrow('No authentication token available')
    expect(axios.get).not.toHaveBeenCalled()
  })

  // 10) getAuthUser com token chama /users/me
  it('getAuthUser com token chama endpoint /users/me', async () => {
    store.setToken('abc')
    axios.get.mockResolvedValueOnce({ data: { id: 1 } })

    const resp = await store.getAuthUser()

    expect(axios.get).toHaveBeenCalledWith('http://api.test/users/me')
    expect(resp.data.id).toBe(1)
  })

  // 11) métodos protegidos (exemplo: postMatch) lançam erro se não houver token
  it('postMatch lança erro se não houver token', async () => {
    store.clearToken()

    await expect(store.postMatch({ type: '9' })).rejects.toThrow('No authentication token available')
    expect(axios.post).not.toHaveBeenCalled()
  })

  // 12) interceptor limpa token em respostas 401/403
  it('interceptor de resposta limpa token em 401/403', async () => {
    store.setToken('abc')

    // simulamos o handler de erro do interceptor
    const error401 = { response: { status: 401 } }
    await axios._onRejected(error401).catch(() => {}) // ele faz reject de qualquer maneira

    expect(store.token).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined()
  })
})
