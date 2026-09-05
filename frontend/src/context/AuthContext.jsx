import { createContext, useContext, useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { loginApi, getMeApi, switchEmployeeApi, ROLE_ACCOUNTS } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(null)
  const [activeRole, setActiveRole] = useState(localStorage.getItem('activeRole') || 'ADMIN')
  const [activeEmployeeName, setActiveEmployeeName] = useState(localStorage.getItem('activeEmployeeName') || '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const userData = await getMeApi()
          setUser(userData)
          setActiveRole(userData.role)
          localStorage.setItem('activeRole', userData.role)
        } catch (err) {
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
      localStorage.removeItem('activeEmployeeName')
      setActiveEmployeeName('')
      setToken(data.access_token)
      setActiveRole(data.role)
      setUser({ id: data.user_id, email: data.email, role: data.role, employee_id: data.employee_id })
      queryClient.invalidateQueries()
    } catch (err) {
      // Graceful fallback
    }
  }

  const switchRole = async (roleName) => {
    setLoading(true)
    await performAutoLogin(roleName)
    setLoading(false)
  }

  const switchToEmployee = async (employeeId, employeeName) => {
    setLoading(true)
    try {
      const data = await switchEmployeeApi(employeeId)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('activeRole', data.role)
      localStorage.setItem('activeEmployeeName', employeeName || data.email)
      setToken(data.access_token)
      setActiveRole(data.role)
      setActiveEmployeeName(employeeName || data.email)
      setUser({ id: data.user_id, email: data.email, role: data.role, employee_id: data.employee_id, name: employeeName })
    } catch (err) {
      console.error('Failed to switch employee:', err)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('activeRole')
    localStorage.removeItem('activeEmployeeName')
    setToken('')
    setUser(null)
    setActiveRole('EMPLOYEE')
    setActiveEmployeeName('')
  }

  return (
    <AuthContext.Provider value={{ token, user, activeRole, activeEmployeeName, loading, switchRole, switchToEmployee, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
