import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

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

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    inject: (key) => {
      if (key === 'apiBaseURL') return 'http://api.test'
      return undefined
    },
  }
})

import axios from 'axios'
import { useAPIStore } from '@/stores/api'

describe('API Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    axios.defaults.headers.common = {}
    store = useAPIStore()
  })

  it('initializeToken lê auth_token do localStorage e configura token + axios header', () => {
    store.clearToken()
    localStorage.setItem('auth_token', 'abc123')
    store.initializeToken()
    expect(store.token).toBe('abc123')
    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer abc123')
  })

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

  it('clearToken limpa token, localStorage e Authorization header', () => {
    store.setToken('something')
    store.clearToken()
    expect(store.token).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined()
  })

  it('validateToken devolve true sem chamar axios se não houver token', async () => {
    store.clearToken()
    store.isValidating = false
    const result = await store.validateToken()
    expect(result).toBe(true)
    expect(axios.get).not.toHaveBeenCalled()
  })

  it('validateToken com token definido chama /users/me e devolve true em sucesso', async () => {
    store.setToken('abc')
    axios.get.mockResolvedValueOnce({ data: { id: 1 } })
    const result = await store.validateToken()
    expect(axios.get).toHaveBeenCalledWith('http://api.test/users/me')
    expect(result).toBe(true)
    expect(store.isValidating).toBe(false)
    expect(store.token).toBe('abc')
  })

  it('validateToken em erro limpa token e devolve false', async () => {
    store.setToken('abc')
    axios.get.mockRejectedValueOnce(new Error('401'))
    const result = await store.validateToken()
    expect(result).toBe(false)
    expect(store.token).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

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

  it('postLogin lança erro se resposta não contiver token', async () => {
    const credentials = { email: 'a@mail.pt', password: '123' }
    axios.post.mockResolvedValueOnce({ data: {} })
    await expect(store.postLogin(credentials)).rejects.toThrow('No token returned.')
    expect(store.token).toBeNull()
  })

  it('getAuthUser lança erro se não houver token', async () => {
    store.clearToken()
    await expect(store.getAuthUser()).rejects.toThrow('No authentication token available')
    expect(axios.get).not.toHaveBeenCalled()
  })

  it('getAuthUser com token chama endpoint /users/me', async () => {
    store.setToken('abc')
    axios.get.mockResolvedValueOnce({ data: { id: 1 } })
    const resp = await store.getAuthUser()
    expect(axios.get).toHaveBeenCalledWith('http://api.test/users/me')
    expect(resp.data.id).toBe(1)
  })

  it('postMatch lança erro se não houver token', async () => {
    store.clearToken()
    await expect(store.postMatch({ type: '9' })).rejects.toThrow('No authentication token available')
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('interceptor de resposta limpa token em 401/403', async () => {
    store.setToken('abc')
    const error401 = { response: { status: 401 } }
    await axios._onRejected(error401).catch(() => {})
    expect(store.token).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined()
  })
})
