import client from './client'

export const loginApi = async (email, password) => {
  const response = await client.post('/auth/login', { email, password })
  return response.data
}

export const getMeApi = async () => {
  const response = await client.get('/auth/me')
  return response.data
}

export const switchEmployeeApi = async (employeeId) => {
  const response = await client.post(`/auth/switch-employee/${employeeId}`)
  return response.data
}

export const ROLE_ACCOUNTS = [
  { role: 'ADMIN', label: 'Admin', email: 'admin@peoplepay360.dev' },
  { role: 'HR_MANAGER', label: 'HR Manager', email: 'hr.manager@peoplepay360.dev' },
  { role: 'HR_PAYROLL_USER', label: 'Payroll User', email: 'payroll.user@peoplepay360.dev' },
  { role: 'HR_PAYROLL_MANAGER', label: 'Payroll Manager', email: 'payroll.manager@peoplepay360.dev' },
  { role: 'EMPLOYEE', label: 'Employee (Alice)', email: 'alice.johnson@peoplepay360.dev' },
]
