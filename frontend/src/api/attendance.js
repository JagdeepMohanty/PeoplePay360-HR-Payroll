import client from './client'

export const getAttendance = async (employeeId = null) => {
  const params = employeeId ? { employee_id: employeeId } : {}
  const res = await client.get('/attendance/', { params })
  return res.data
}

export const logAttendance = async (data) => {
  const res = await client.post('/attendance/', data)
  return res.data
}
