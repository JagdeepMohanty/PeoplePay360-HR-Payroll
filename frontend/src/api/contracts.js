import client from './client'

export const getContracts = async (employeeId = null) => {
  const params = employeeId ? { employee_id: employeeId } : {}
  const res = await client.get('/contracts', { params })
  return res.data
}

export const getActiveContract = async (employeeId) => {
  const res = await client.get(`/contracts/active/${employeeId}`)
  return res.data
}

export const getContract = async (id) => {
  const res = await client.get(`/contracts/${id}`)
  return res.data
}

export const createContract = async (data) => {
  const res = await client.post('/contracts', data)
  return res.data
}

export const updateContract = async (id, data) => {
  const res = await client.put(`/contracts/${id}`, data)
  return res.data
}
