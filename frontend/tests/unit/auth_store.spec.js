import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/stores/api', () => {
  const apiStore = {
    token: { value: null },
    postLogin: vi.fn(),
    getAuthUser: vi.fn(),
    postRegister: vi.fn(),
    postLogout: vi.fn(),
    setToken: vi.fn(),
  }

  return {
    useAPIStore: () => apiStore,
  }
})

import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

if (typeof FormData === 'undefined') {
  global.FormData = class {
    constructor() {
      this._entries = []
    }
    append(key, value) {
      this._entries.push([key, value])
    }
  }
}

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('inicializa com currentUser undefined e isLoggedIn=false quando não há stored user', () => {
    const authStore = useAuthStore()
    expect(authStore.currentUser).toBeUndefined()
    expect(authStore.isLoggedIn).toBe(false)
  })

  it('initializeAuth usa logged_user + auth_token do localStorage e chama apiStore.setToken', () => {
    const storedUser = { id: 1, name: 'Red' }
    localStorage.setItem('logged_user', JSON.stringify(storedUser))
    localStorage.setItem('auth_token', 'abc123')

    const apiStore = useAPIStore()
    const authStore = useAuthStore()

    expect(authStore.currentUser).toEqual(storedUser)
    expect(authStore.isLoggedIn).toBe(true)
    expect(apiStore.setToken).toHaveBeenCalledWith('abc123')
  })

  it('login de sucesso atualiza currentUser, localStorage e chama API correta', async () => {
    const apiStore = useAPIStore()
    const authStore = useAuthStore()

    const credentials = { email: 'user@mail.pt', password: 'secret' }
    const userFromApi = { id: 42, name: 'Red' }

    apiStore.postLogin.mockResolvedValueOnce({
      data: { token: 'jwt-token' },
    })
    apiStore.getAuthUser.mockResolvedValueOnce({
      data: userFromApi,
    })

    const result = await authStore.login(credentials)

    expect(apiStore.postLogin).toHaveBeenCalledWith(credentials)
    expect(apiStore.getAuthUser).toHaveBeenCalled()
    expect(result).toEqual(userFromApi)
    expect(authStore.currentUser).toEqual(userFromApi)
    expect(authStore.isLoggedIn).toBe(true)
    expect(localStorage.getItem('logged_user')).toBe(JSON.stringify(userFromApi))
  })

  it('login em erro limpa currentUser e logged_user e propaga o erro', async () => {
    const apiStore = useAPIStore()
    const authStore = useAuthStore()

    const credentials = { email: 'user@mail.pt', password: 'secret' }

    apiStore.postLogin.mockResolvedValueOnce({
      data: { token: 'jwt-token' },
    })
    apiStore.getAuthUser.mockRejectedValueOnce(new Error('Boom'))

    await expect(authStore.login(credentials)).rejects.toThrow('Boom')

    expect(authStore.currentUser).toBeUndefined()
    expect(authStore.isLoggedIn).toBe(false)
    expect(localStorage.getItem('logged_user')).toBeNull()
  })

  it('register chama postRegister com FormData e depois login com email/password', async () => {
    const apiStore = useAPIStore()
    const authStore = useAuthStore()

    const userPayload = {
      name: 'Red',
      email: 'user@mail.pt',
      password: 'secret',
      confirmPassword: 'secret',
      nickname: 'Redwizard',
      photo: null,
    }

    apiStore.postRegister.mockResolvedValueOnce({})
    apiStore.postLogin.mockResolvedValueOnce({
      data: { token: 'jwt-token' },
    })
    apiStore.getAuthUser.mockResolvedValueOnce({
      data: { id: 1, name: 'Red' },
    })

    const result = await authStore.register(userPayload)

    expect(apiStore.postRegister).toHaveBeenCalledTimes(1)
    const formArg = apiStore.postRegister.mock.calls[0][0]
    expect(formArg).toBeInstanceOf(FormData)

    expect(apiStore.postLogin).toHaveBeenCalledWith({
      email: userPayload.email,
      password: userPayload.password,
    })

    expect(result).toEqual({ id: 1, name: 'Red' })
    expect(authStore.currentUser).toEqual({ id: 1, name: 'Red' })
    expect(authStore.isLoggedIn).toBe(true)
  })

  it('logout chama postLogout se houver token e limpa estado mesmo se API falhar', async () => {
    const apiStore = useAPIStore()
    const authStore = useAuthStore()

    authStore.currentUser = { id: 1, name: 'Red' }
    localStorage.setItem('logged_user', JSON.stringify(authStore.currentUser))
    localStorage.setItem('auth_token', 'abc123')
    apiStore.token.value = 'abc123'

    apiStore.postLogout.mockRejectedValueOnce(new Error('Network error'))

    await authStore.logout()

    expect(apiStore.postLogout).toHaveBeenCalledTimes(1)
    expect(authStore.currentUser).toBeUndefined()
    expect(authStore.isLoggedIn).toBe(false)
    expect(localStorage.getItem('logged_user')).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('logout não chama postLogout se apiStore.token.value estiver vazio', async () => {
    const apiStore = useAPIStore()
    const authStore = useAuthStore()

    apiStore.token.value = null
    authStore.currentUser = { id: 1 }

    await authStore.logout()

    expect(apiStore.postLogout).not.toHaveBeenCalled()
    expect(authStore.currentUser).toBeUndefined()
    expect(localStorage.getItem('logged_user')).toBeNull()
  })

  it('refreshUser com token atualiza currentUser e logged_user em sucesso', async () => {
    const apiStore = useAPIStore()
    const authStore = useAuthStore()

    apiStore.token.value = 'abc123'
    const refreshedUser = { id: 1, name: 'Updated' }

    apiStore.getAuthUser.mockResolvedValueOnce({
      data: refreshedUser,
    })

    await authStore.refreshUser()

    expect(apiStore.getAuthUser).toHaveBeenCalledTimes(1)
    expect(authStore.currentUser).toEqual(refreshedUser)
    expect(localStorage.getItem('logged_user')).toBe(JSON.stringify(refreshedUser))
  })

  it('refreshUser com erro 401 limpa user, storage e reset do token no apiStore', async () => {
    const apiStore = useAPIStore()
    const authStore = useAuthStore()

    apiStore.token.value = 'abc123'
    authStore.currentUser = { id: 1, name: 'Red' }
    localStorage.setItem('logged_user', JSON.stringify(authStore.currentUser))
    localStorage.setItem('auth_token', 'abc123')

    apiStore.getAuthUser.mockRejectedValueOnce({
      response: { status: 401 },
    })

    await authStore.refreshUser()

    expect(authStore.currentUser).toBeUndefined()
    expect(localStorage.getItem('logged_user')).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(apiStore.setToken).toHaveBeenCalledWith(undefined)
  })
})
