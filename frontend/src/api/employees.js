import client from './client'

export const getEmployees = async () => {
  const res = await client.get('/employees/')
  return res.data
}

export const getMyProfile = async () => {
  const res = await client.get('/employees/me')
  return res.data
}

export const getEmployee = async (id) => {
  const res = await client.get(`/employees/${id}`)
  return res.data
}

export const createEmployee = async (data) => {
  const res = await client.post('/employees/', data)
  return res.data
}

export const updateEmployee = async (id, data) => {
  const res = await client.put(`/employees/${id}`, data)
  return res.data
}

export const deleteEmployee = async (id) => {
  const res = await client.delete(`/employees/${id}`)
  return res.data
}
