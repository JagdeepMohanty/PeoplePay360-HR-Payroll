import { createContext, useContext, useState, useEffect } from 'react'
import { loginApi, getMeApi, ROLE_ACCOUNTS } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(null)
  const [activeRole, setActiveRole] = useState(localStorage.getItem('activeRole') || 'ADMIN')
  const [loading, setLoading] = useState(true)

  // Automatic initial login as default ADMIN or stored token validation
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const userData = await getMeApi()
          setUser(userData)
          setActiveRole(userData.role)
          localStorage.setItem('activeRole', userData.role)
        } catch (err) {
          console.warn('Stored token invalid, auto-logging in default Admin...')
          await performAutoLogin('ADMIN')
        }
      } else {
        await performAutoLogin('ADMIN')
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const performAutoLogin = async (roleName) => {
    const acc = ROLE_ACCOUNTS.find((a) => a.role === roleName) || ROLE_ACCOUNTS[0]
    try {
      const data = await loginApi(acc.email, 'password123')
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('activeRole', data.role)
      setToken(data.access_token)
      setActiveRole(data.role)
      setUser({ id: data.user_id, email: data.email, role: data.role, employee_id: data.employee_id })
    } catch (err) {
      console.error('Auto login failed:', err)
    }
  }

  const switchRole = async (roleName) => {
    setLoading(true)
    await performAutoLogin(roleName)
    setLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('activeRole')
    setToken('')
    setUser(null)
    setActiveRole('EMPLOYEE')
  }

  return (
    <AuthContext.Provider value={{ token, user, activeRole, loading, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
