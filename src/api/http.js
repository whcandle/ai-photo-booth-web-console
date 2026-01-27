import axios from 'axios'
import { useAuthStore } from '../store/auth'

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 10000
})

http.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    const token = authStore.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('Request with token:', config.url)
    } else {
      console.warn('No token found for request:', config.url)
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

http.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default http
