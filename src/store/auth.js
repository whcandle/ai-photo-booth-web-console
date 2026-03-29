import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login } from '../api/auth'
import { getPermissions } from '../api/adminSystemPermissions'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const role = ref(localStorage.getItem('role') || '')
  const merchantId = ref(localStorage.getItem('merchantId') || null)
  const displayName = ref(localStorage.getItem('displayName') || '')
  const permissions = ref(JSON.parse(localStorage.getItem('permissions') || '[]'))

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
    localStorage.removeItem('permissions')
  }

  async function fetchPermissions() {
    if (!token.value) return
    try {
      const res = await getPermissions()
      if (res?.data?.success) {
        permissions.value = res.data.data || []
        localStorage.setItem('permissions', JSON.stringify(permissions.value))
      }
    } catch (e) {
      // permissions 拉取失败不影响登录流程
      // 后续按钮级功能将表现为“默认隐藏”
      permissions.value = []
      localStorage.setItem('permissions', JSON.stringify([]))
    }
  }

  async function doLogin(email, password) {
    try {
      const response = await login(email, password)
      if (response.data.success) {
        setAuth(response.data.data)
        permissions.value = []
        localStorage.setItem('permissions', JSON.stringify([]))
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
    permissions,
    isAuthenticated,
    setAuth,
    logout,
    fetchPermissions,
    doLogin
  }
})
