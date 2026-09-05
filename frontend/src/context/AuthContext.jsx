import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginApi, getMeApi, getAccessByEmployeeId, ROLE_ACCOUNTS } from '../api/auth'
import { getRolePermissions, hasPermission as checkPermission } from '../lib/permissions'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(null)
  const [employeeId, setEmployeeId] = useState(localStorage.getItem('employeeId') || '')
  const [activeRole, setActiveRole] = useState(localStorage.getItem('activeRole') || '')
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('permissions')
    return saved ? JSON.parse(saved) : []
  })
  const [loading, setLoading] = useState(true)
  const [showAccessModal, setShowAccessModal] = useState(false)

  // Initialize auth state on mount
  useEffect(() => {
    async function initAuth() {
      const storedEmpId = localStorage.getItem('employeeId')
      if (storedEmpId) {
        try {
          const accessData = await getAccessByEmployeeId(storedEmpId)
          applyAccessSession(accessData)
        } catch (err) {
          console.warn('Stored Employee ID invalid, requesting login...', err)
          clearAccessSession()
        }
      } else if (token) {
        try {
          const userData = await getMeApi()
          setUser(userData)
          const role = userData.role || 'employee'
          const perms = getRolePermissions(role)
          setActiveRole(role)
          setPermissions(perms)
        } catch (err) {
          console.warn('Stored token invalid, auto-logging default persona...')
          await performAutoLogin('HR_PAYROLL_MANAGER')
        }
      } else {
        // Prompt for Employee ID if no session exists
        setShowAccessModal(true)
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const applyAccessSession = (accessData) => {
    const empId = accessData.employeeId
    const role = accessData.role
    const perms = accessData.permissions || getRolePermissions(role)

    setEmployeeId(empId)
    setActiveRole(role)
    setPermissions(perms)
    setUser({
      employee_id: empId,
      role: role,
      email: `${empId.toLowerCase()}@peoplepay360.dev`,
    })

    localStorage.setItem('employeeId', empId)
    localStorage.setItem('activeRole', role)
    localStorage.setItem('permissions', JSON.stringify(perms))
    setShowAccessModal(false)
  }

  const clearAccessSession = () => {
    localStorage.removeItem('employeeId')
    localStorage.removeItem('activeRole')
    localStorage.removeItem('permissions')
    localStorage.removeItem('token')
    setEmployeeId('')
    setActiveRole('')
    setPermissions([])
    setToken('')
    setUser(null)
    setShowAccessModal(true)
  }

  const loginWithEmployeeId = async (id) => {
    setLoading(true)
    try {
      const accessData = await getAccessByEmployeeId(id)
      applyAccessSession(accessData)

      // Optionally authenticate with default token in background if available
      try {
        const acc = ROLE_ACCOUNTS[0]
        const data = await loginApi(acc.email, 'password123')
        if (data?.access_token) {
          localStorage.setItem('token', data.access_token)
          setToken(data.access_token)
        }
      } catch (e) {
        // Ignore API token error for employee ID lookup
      }
      return accessData
    } finally {
      setLoading(false)
    }
  }

  const performAutoLogin = async (roleName) => {
    const acc = ROLE_ACCOUNTS.find((a) => a.role === roleName) || ROLE_ACCOUNTS[0]
    try {
      const data = await loginApi(acc.email, 'password123')
      localStorage.setItem('token', data.access_token)
      setToken(data.access_token)

      const mappedRole = roleName === 'EMPLOYEE' ? 'employee' : roleName === 'HR_MANAGER' ? 'hr' : 'hr_payroll'
      const perms = getRolePermissions(mappedRole)

      setActiveRole(mappedRole)
      setPermissions(perms)
      setEmployeeId(data.employee_id || 'PAY001')

      localStorage.setItem('activeRole', mappedRole)
      localStorage.setItem('permissions', JSON.stringify(perms))
      localStorage.setItem('employeeId', data.employee_id || 'PAY001')

      setUser({ id: data.user_id, email: data.email, role: mappedRole, employee_id: data.employee_id })
      setShowAccessModal(false)
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
    clearAccessSession()
  }

  const hasPermission = useCallback(
    (requiredPermission) => {
      return checkPermission(permissions, requiredPermission)
    },
    [permissions]
  )

  const isAuthenticated = Boolean(employeeId || activeRole || token)

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        employeeId,
        activeRole,
        role: activeRole,
        permissions,
        loading,
        isAuthenticated,
        showAccessModal,
        setShowAccessModal,
        loginWithEmployeeId,
        switchRole,
        logout,
        changeEmployee: clearAccessSession,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
