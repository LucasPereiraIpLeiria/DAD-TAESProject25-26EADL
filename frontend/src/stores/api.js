import { defineStore } from 'pinia'
import axios from 'axios'
import { inject, ref } from 'vue'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')

  const getStoredToken = () => {
    return localStorage.getItem('auth_token')
  }

  const token = ref(getStoredToken())

  // Set axios default headers if token exists
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  // Add method to set token externally
  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('auth_token', newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } else {
      localStorage.removeItem('auth_token')
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // AUTH
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
      throw error // VERY IMPORTANT
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
    // Only attempt logout if we have a token
    if (!token.value) {
      return
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/logout`)
      return response
    } finally {
      // Always clear token even if request fails
      setToken(undefined)
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

  // Users
  const getAuthUser = async () => {
    if (!token.value) {
      throw new Error('No authentication token available')
    }
    return await axios.get(`${API_BASE_URL}/users/me`)
  }

  return {
    token,
    setToken,
    postLogin,
    postRegister,
    postLogout,
    getAuthUser,
    postDeductEntryFee,
    postAwardMatchReward,
  }
})
