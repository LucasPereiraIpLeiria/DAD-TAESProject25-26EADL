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
    const responseToken = response.data.token

    if (!responseToken) {
      throw new Error('No token received from login API')
    }

    setToken(responseToken)
    return response
  }

  const postRegister = async (user) => {
    // user could be a plain object or FormData
    let payload = user

    // If it's a plain object, convert to FormData
    if (!(user instanceof FormData)) {
      payload = new FormData()
      for (const key in user) {
        if (user[key] !== null && user[key] !== undefined) {
          payload.append(key, user[key])
        }
      }
    }

    // Axios will automatically set correct multipart/form-data headers
    const response = await axios.post(`${API_BASE_URL}/register`, payload)
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

  const postDeductEntryFee = async () => {
    if (!token.value) {
      throw new Error('No authentication token available')
    }

    return axios.post(`${API_BASE_URL}/economy/deduct-entry-fee`)
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
  }
})
