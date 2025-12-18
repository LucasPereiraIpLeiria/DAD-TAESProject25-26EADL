import { defineStore } from 'pinia'
import axios from 'axios'
import { inject, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.js'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')
  const token = ref(null)
  const isValidating = ref(false)

  // inicializar token a partir de localStorage e configurar axios
  const initializeToken = () => {
    const stored = localStorage.getItem('auth_token')
    if (stored) {
      token.value = stored
      axios.defaults.headers.common['Authorization'] = `Bearer ${stored}`
    }
  }

  initializeToken()

  // validar token atual chamando /users/me
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

  // definir token (guardar em localStorage e header Authorization)
  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('auth_token', newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } else {
      clearToken()
    }
  }

  // limpar token de memória, localStorage e axios
  const clearToken = () => {
    token.value = null
    useAuthStore().logout()
    delete axios.defaults.headers.common['Authorization']
  }

  // interceptar respostas 401/403 para limpar token automaticamente
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearToken()
      }
      return Promise.reject(error)
    },
  )

  // ───────────────────────────────────────────────
  // AUTH
  // ───────────────────────────────────────────────

  // autenticar utilizador e guardar token
  const postLogin = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials)
    const responseToken = response.data.token
    if (!responseToken) throw new Error('No token returned.')
    setToken(responseToken)
    return response
  }

  // registar novo utilizador
  const postRegister = async (payload) => {
    return axios.post(`${API_BASE_URL}/register`, payload)
  }

  // terminar sessão no backend e limpar token
  const postLogout = async () => {
    if (token.value) {
      try {
        await axios.post(`${API_BASE_URL}/logout`)
      } finally {
        clearToken()
      }
    }
  }

  // obter utilizador autenticado
  const getAuthUser = async () => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.get(`${API_BASE_URL}/users/me`)
  }

  // ───────────────────────────────────────────────
  // ECONOMY
  // ───────────────────────────────────────────────

  // criar compra de coins
  const postCoinPurchase = async (data, coins) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.post(`${API_BASE_URL}/coin-purchases`, {
      euros: data.euros,
      payment_type: data.payment_type,
      payment_reference: data.payment_reference,
      coins,
    })
  }

  // ───────────────────────────────────────────────
  // MATCHES / GAMES
  // ───────────────────────────────────────────────

  // criar match
  const postMatch = async (match) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.post(`${API_BASE_URL}/matches`, match)
  }

  // atualizar match
  const updateMatch = async (matchId, payload) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.patch(`${API_BASE_URL}/matches/${matchId}`, payload)
  }

  // criar game
  const postGame = async (game) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.post(`${API_BASE_URL}/games`, game)
  }

  // ───────────────────────────────────────────────
  // CUSTOMIZATIONS
  // ───────────────────────────────────────────────

  // comprar item de customização
  const postPurchaseCustomization = async (payload) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.post(`${API_BASE_URL}/customizations/purchase`, payload)
  }

  // selecionar item de customização
  const patchSelectCustomization = async (payload) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.patch(`${API_BASE_URL}/customizations/select`, payload)
  }

  // resetar customizações para estado default (debug)
  const postDebugResetCustomizations = () => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.post(`${API_BASE_URL}/customizations/debug/reset`)
  }

  // ───────────────────────────────────────────────
  // STATS / SCOREBOARDS
  // ───────────────────────────────────────────────

  // obter histórico de jogos/matches do utilizador
  const getUserHistory = async (params = {}) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.get(`${API_BASE_URL}/users/history`, { params })
  }

  // obter estatísticas pessoais do utilizador
  const getUserStats = async (params = {}) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.get(`${API_BASE_URL}/users/stats`, { params })
  }

  // obter scoreboards globais
  const getGlobalScoreboards = async (params = {}) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.get(`${API_BASE_URL}/users/stats/global`, { params })
  }

  // ───────────────────────────────────────────────
  // PROFILE
  // ───────────────────────────────────────────────

  // atualizar perfil (incluindo password e avatar base64)
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

  // eliminar conta do utilizador
  const deleteUser = async (password) => {
    if (!token.value) throw new Error('No authentication token available')
    return axios.delete(`${API_BASE_URL}/users/delete`, {
      data: { password },
    })
  }

  // URLs base para avatares (BD só guarda filename)
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
    postCoinPurchase,
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
