import { defineStore } from 'pinia'
import axios from 'axios'
import { inject, ref } from 'vue'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')
  const token = ref(null)
  const isValidating = ref(false)

  const initializeToken = () => {
    const stored = localStorage.getItem('auth_token')
    if (stored) {
      token.value = stored
      axios.defaults.headers.common['Authorization'] = `Bearer ${stored}`
    }
  }

  initializeToken()

  const validateToken = async () => {
    if (!token.value || isValidating.value) return true

    isValidating.value = true
    try {
      await axios.get(`${API_BASE_URL}/users/me`)
      return true
    } catch {
      clearToken()
      return false
    } finally {
      isValidating.value = false
    }
  }

  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('auth_token', newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } else {
      clearToken()
    }
  }

  const clearToken = () => {
    token.value = null
    localStorage.removeItem('auth_token')
    delete axios.defaults.headers.common['Authorization']
  }

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearToken()
      }
      return Promise.reject(error)
    },
  )

  // Auth
  const postLogin = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials)
    const responseToken = response.data.token
    if (!responseToken) throw new Error('No token returned.')
    setToken(responseToken)
    return response
  }

  const postRegister = async (payload) => {
    return axios.post(`${API_BASE_URL}/register`, payload)
  }

  const postLogout = async () => {
    if (token.value) {
      try {
        await axios.post(`${API_BASE_URL}/logout`)
      } finally {
        clearToken()
      }
    }
  }

  const getAuthUser = async () => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.get(`${API_BASE_URL}/users/me`)
  }

  // Economy
  const postDeductEntryFee = async (payload) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.post(`${API_BASE_URL}/economy/deduct-entry-fee`, payload)
  }

  const postAwardMatchReward = async (payload) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.post(`${API_BASE_URL}/economy/award-match-reward`, payload)
  }

  const postCoinPurchase = async (data, coins) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.post(`${API_BASE_URL}/coin-purchases`, {
      euros: data.euros,
      payment_type: data.payment_type,
      payment_reference: data.payment_reference,
      coins,
    })
  }

  // Matches / Games
  const getUserGames = async () => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.get(`${API_BASE_URL}/users/matches`)
  }

  const postMatch = async (match) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.post(`${API_BASE_URL}/matches`, match)
  }

  const updateMatch = async (matchId, payload) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.patch(`${API_BASE_URL}/matches/${matchId}`, payload)
  }

  const postGame = async (game) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.post(`${API_BASE_URL}/games`, game)
  }

  // Customizations
  const postPurchaseCustomization = async (payload) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.post(`${API_BASE_URL}/customizations/purchase`, payload)
  }

  const patchSelectCustomization = async (payload) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.patch(`${API_BASE_URL}/customizations/select`, payload)
  }

  const postDebugResetCustomizations = () => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.post(`${API_BASE_URL}/customizations/debug/reset`)
  }

  const getUserHistory = async (params = {}) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.get(`${API_BASE_URL}/users/history`, { params })
  }

  async function getUserStats(params = {}) {
    return axios.get(`${API_BASE_URL}/users/stats`, { params })
  }

  async function getGlobalScoreboards(params = {}) {
    return axios.get(`${API_BASE_URL}/users/stats/global`, { params })
  }

  // Profile
  const updateProfile = async (data) => {
    if (!token.value) throw new Error('No authentication token available')

    let photoBase64 = null
    if (data.photo instanceof File) {
      photoBase64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(data.photo)
      })
    }

    const payload = {
      name: data.name,
      email: data.email,
      nickname: data.nickname,
    }

    if (data.currentPassword?.trim()) {
      payload.currentPassword = data.currentPassword
      payload.newPassword = data.newPassword
      payload.newPassword_confirmation = data.confirmPassword
    }

    if (photoBase64) payload.photo = photoBase64

    return axios.patch(`${API_BASE_URL}/users/edit`, payload)
  }

  const deleteUser = async (password) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.delete(`${API_BASE_URL}/users/delete`, {
      data: { password },
    })
  }

  const photoAvatarStorageURL = 'http://127.0.0.1:8000/storage/photos_avatars/'
  const anonymousAvatarStorageURL = 'http://127.0.0.1:8000/storage/photos_avatars/anonymous.png'

  return {
    token,
    isValidating,
    initializeToken,
    setToken,
    clearToken,
    validateToken,
    postLogin,
    postRegister,
    postLogout,
    getAuthUser,
    postDeductEntryFee,
    postAwardMatchReward,
    postCoinPurchase,
    getUserGames,
    postMatch,
    updateMatch,
    postGame,
    postPurchaseCustomization,
    patchSelectCustomization,
    postDebugResetCustomizations,
    updateProfile,
    deleteUser,
    getUserHistory,
    getUserStats,
    getGlobalScoreboards,
    photoAvatarStorageURL,
    anonymousAvatarStorageURL,
  }
})
