import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT Bearer token if present in localStorage
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Global response interceptor for 401 (token expiration) and 403 (unauthorized)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          console.warn('Session expired or unauthorized. Redirecting to login.')
          window.location.href = '/login'
        }
      } else if (status === 403) {
        console.warn('Access forbidden for current user role:', error.response.data?.detail)
      }
    }
    return Promise.reject(error)
  }
)

export default client
