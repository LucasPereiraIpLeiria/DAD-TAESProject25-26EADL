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
    const response = await axios.post(`${API_BASE_URL}/login`, credentials)

    // Adjust this based on your actual API response structure
    const responseToken = response.data.token || response.data.access_token

    if (!responseToken) {
      throw new Error('No token received from login API')
    }

    setToken(responseToken)
    return response
  }

  const postLogout = async () => {
    // Only attempt logout if we have a token
    if (!token.value) {
      console.warn('No token available for logout')
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
    postLogout,
    getAuthUser,
  }
})
