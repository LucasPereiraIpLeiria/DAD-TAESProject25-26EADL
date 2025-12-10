import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()

  const getStoredUser = () => {
    const stored = localStorage.getItem('logged_user')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return stored
      }
    }
    return undefined
  }

  const currentUser = ref(getStoredUser())

  const isLoggedIn = computed(() => {
    return currentUser.value !== undefined && currentUser.value !== null
  })

  const login = async (credentials) => {
    try {
      await apiStore.postLogin(credentials)
      const response = await apiStore.getAuthUser()
      currentUser.value = response.data
      localStorage.setItem('logged_user', JSON.stringify(response.data))
      return response.data
    } catch (error) {
      currentUser.value = undefined
      localStorage.removeItem('logged_user')
      throw error
    }
  }

  const register = async (user) => {
    const payload = new FormData()
    for (const key in user) {
      if (user[key] !== null && user[key] !== undefined) {
        payload.append(key, user[key])
      }
    }

    try {
      await apiStore.postRegister(payload)
      return await login({ email: user.email, password: user.password })
    } catch (error) {
      console.error('Register error full object:', error)
      console.error('Register error response:', error?.response)
      console.error('Register error data:', error?.response?.data)
      throw error
    }
  }

  const logout = async () => {
    try {
      if (apiStore.token.value) {
        await apiStore.postLogout()
      }
    } catch (error) {
      console.warn(
        'Logout API call failed, clearing local state anyway:',
        error.message
      )
    } finally {
      currentUser.value = undefined
      localStorage.removeItem('logged_user')
      localStorage.removeItem('auth_token')
    }
  }

  const initializeAuth = () => {
    const storedUser = getStoredUser()
    const storedToken = localStorage.getItem('auth_token')

    if (storedUser && storedToken) {
      currentUser.value = storedUser
      apiStore.setToken(storedToken)
    } else {
      currentUser.value = undefined
      localStorage.removeItem('logged_user')
      localStorage.removeItem('auth_token')
    }
  }

  const refreshUser = async () => {
    if (!apiStore.token) {
      console.warn('refreshUser: no token found, skipping refresh')
      return
    }

    try {
      const response = await apiStore.getAuthUser()
      currentUser.value = response.data
      localStorage.setItem('logged_user', JSON.stringify(response.data))
    } catch (error) {
      console.error('Failed to refresh user:', error)
      if (error.response?.status === 401) {
        currentUser.value = undefined
        localStorage.removeItem('logged_user')
        localStorage.removeItem('auth_token')
        apiStore.setToken(undefined)
      }
    }
  }

  initializeAuth()

  return {
    currentUser,
    isLoggedIn,
    login,
    register,
    logout,
    refreshUser,
  }
})
