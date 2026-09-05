import client from './client'

export const getAttendance = async (employeeId = null) => {
  const params = employeeId ? { employee_id: employeeId } : {}
  const res = await client.get('/attendance', { params })
  return res.data
}

export const getAttendanceStatus = async (employeeId = null) => {
  const params = employeeId ? { employee_id: employeeId } : {}
  const res = await client.get('/attendance/status', { params })
  return res.data
}

export const punchAttendance = async (employeeId = null) => {
  const payload = employeeId ? { employee_id: employeeId } : {}
  const res = await client.post('/attendance/punch', payload)
  return res.data
}

export const logAttendance = async (data) => {
  const res = await client.post('/attendance', data)
  return res.data
}

export const updateAttendance = async (id, data) => {
  const res = await client.put(`/attendance/${id}`, data)
  return res.data
}

export const deleteAttendance = async (id) => {
  const res = await client.delete(`/attendance/${id}`)
  return res.data
}

