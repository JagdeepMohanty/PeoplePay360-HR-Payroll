import client from './client'

export const getDashboard = ({ dept, period } = {}) => {
  const params = {}
  if (dept) params.dept = dept
  if (period) params.period = period
  return client.get('/reports/dashboard', { params }).then(r => r.data)
}
