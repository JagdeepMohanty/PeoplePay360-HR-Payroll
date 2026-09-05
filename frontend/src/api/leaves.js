import client from './client'

export const getTimeOffTypes = async () => {
  const res = await client.get('/leaves/types')
  return res.data
}

export const getLeaveAllocations = async (employeeId = null, year = null) => {
  const params = {}
  if (employeeId) params.employee_id = employeeId
  if (year) params.year = year
  const res = await client.get('/leaves/allocations', { params })
  return res.data
}

export const getLeaveRequests = async (employeeId = null) => {
  const params = employeeId ? { employee_id: employeeId } : {}
  const res = await client.get('/leaves/', { params })
  return res.data
}

export const submitLeave = async (data) => {
  const res = await client.post('/leaves/', data)
  return res.data
}

export const approveLeave = async (leaveId) => {
  const res = await client.post(`/leaves/approve/${leaveId}`)
  return res.data
}

export const refuseLeave = async (leaveId) => {
  const res = await client.post(`/leaves/refuse/${leaveId}`)
  return res.data
}
