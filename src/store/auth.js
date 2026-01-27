import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const role = ref(localStorage.getItem('role') || '')
  const merchantId = ref(localStorage.getItem('merchantId') || null)
  const displayName = ref(localStorage.getItem('displayName') || '')

  const isAuthenticated = computed(() => !!token.value)

  function setAuth(data) {
    token.value = data.token
    role.value = data.role
    merchantId.value = data.merchantId
    displayName.value = data.displayName || ''
    
    localStorage.setItem('token', data.token)
    localStorage.setItem('role', data.role)
    if (data.merchantId) {
      localStorage.setItem('merchantId', data.merchantId)
    }
    if (data.displayName) {
      localStorage.setItem('displayName', data.displayName)
    }
  }

  function logout() {
    token.value = ''
    role.value = ''
    merchantId.value = null
    displayName.value = ''
    
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('merchantId')
    localStorage.removeItem('displayName')
  }

  async function doLogin(email, password) {
    try {
      const response = await login(email, password)
      if (response.data.success) {
        setAuth(response.data.data)
        return { success: true }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' }
    }
  }

  return {
    token,
    role,
    merchantId,
    displayName,
    isAuthenticated,
    setAuth,
    logout,
    doLogin
  }
})
