import { defineStore } from 'pinia'
import axios from 'axios'
import { inject, ref } from 'vue'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')
  const token = ref(null)
  const isValidating = ref(false)

  // Initialize token from localStorage
  const initializeToken = () => {
    const stored = localStorage.getItem('auth_token')
    if (stored) {
      token.value = stored
      axios.defaults.headers.common['Authorization'] = `Bearer ${stored}`
    }
  }

  // Call this once when your app starts (in main.js or router setup)
  initializeToken()

  // Validate token with backend - call this periodically or on app init
  const validateToken = async () => {
    if (!token.value || isValidating.value) return true

    isValidating.value = true
    try {
      await axios.get(`${API_BASE_URL}/users/me`)
      return true
    } catch (error) {
      // Token is invalid - clear it
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

  // Setup axios interceptor to handle 401/403 responses
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // If we get 401 (Unauthorized) or 403 (Forbidden), token is invalid
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearToken()
        // Optional: redirect to login
        // window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  const postLogin = async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, credentials)
      const responseToken = response.data.token

      if (!responseToken) {
        throw new Error('No token received from login API')
      }

      setToken(responseToken)
      return response
    } catch (error) {
      throw error
    }
  }

  const postRegister = async (payload) => {
    try {
      return await axios.post(`${API_BASE_URL}/register`, payload)
    } catch (error) {
      throw error
    }
  }

  const postLogout = async () => {
    if (!token.value) {
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/logout`)
    } finally {
      clearToken()
    }
  }

  const postDeductEntryFee = async (payload) => {
    if (!token.value) {
      throw new Error('No authentication token available')
    }

    return axios.post(`${API_BASE_URL}/economy/deduct-entry-fee`, payload)
  }

  const postAwardMatchReward = async (payload) => {
    if (!token.value) {
      throw new Error('No authentication token available')
    }

    return axios.post(`${API_BASE_URL}/economy/award-match-reward`, payload)
  }

  const getAuthUser = async () => {
    if (!token.value) {
      throw new Error('No authentication token available')
    }
    return axios.get(`${API_BASE_URL}/users/me`)
  }


  const getLeaderboard = async (payload) => {
    return await axios.post(`${API_BASE_URL}/leaderboard`, payload);
  };


  const postCoinPurchase = async (data, coins) => {
    if (!token.value) {
      throw new Error('No authentication token available')
    }

    return axios.post(`${API_BASE_URL}/coin-purchases`, {
      euros: data.euros,
      payment_type: data.payment_type,
      payment_reference: data.payment_reference,
      coins: coins,
    })
  }

  //get user games

  const getUserGames = async() =>{
        if (!token.value) {
      throw new Error('No authentication token available')
    }
    const response = await axios.get(`${API_BASE_URL}/users/matches`);
    //console.log(response);
    return response;
  }

  const postStandalone = (game) => {
    return axios.post(`${API_BASE_URL}/standalone`, game)
  }

  /*const postMatche = (game) => {
    return axios.post(`${API_BASE_URL}/matches`, game)
  }*/

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
    getLeaderboard,
    postDeductEntryFee,
    postAwardMatchReward,
    postCoinPurchase,
    getUserGames,
    postStandalone,
    photoAvatarStorageURL,
    anonymousAvatarStorageURL,
    //postMatche
  }
})


