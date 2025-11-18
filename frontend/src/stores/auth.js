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

  const logout = async () => {
    try {
      // Check if we have a valid token before attempting API logout
      if (apiStore.token) {
        await apiStore.postLogout()
      }
    } catch (error) {
      console.warn('Logout API call failed, clearing local state anyway:', error.message)
      // Don't throw error - we still want to clear local state
    } finally {
      // Always clear local state regardless of API call success
      currentUser.value = undefined
      localStorage.removeItem('logged_user')
      localStorage.removeItem('auth_token')
    }
  }

  // Initialize auth state on store creation
  const initializeAuth = () => {
    const storedUser = getStoredUser()
    const storedToken = localStorage.getItem('auth_token')

    if (storedUser && storedToken) {
      currentUser.value = storedUser
      apiStore.setToken(storedToken)
    } else {
      // Clear inconsistent state
      currentUser.value = undefined
      localStorage.removeItem('logged_user')
      localStorage.removeItem('auth_token')
    }
  }

  initializeAuth()

  return {
    currentUser,
    isLoggedIn,
    login,
    logout,
  }
})
