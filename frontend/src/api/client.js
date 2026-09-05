import axios from 'axios'

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (err) => Promise.reject(err)
)

client.interceptors.response.use(
  (res) => res,
  (err) => {
    console.warn('[API Error]', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

export default client
