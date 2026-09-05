import client from './client'

export const getDashboardMetrics = async (filters = {}) => {
  const params = {}
  if (filters.period) params.period = filters.period
  if (filters.dept) params.dept = filters.dept
  if (filters.employee_type) params.employee_type = filters.employee_type
  
  const res = await client.get('/reports/dashboard/metrics', { params })
  return res.data
}
