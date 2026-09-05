import client from './client'

export const getSalaryStructures = async () => {
  const res = await client.get('/salary-structures/')
  return res.data
}

export const createSalaryStructure = async (data) => {
  const res = await client.post('/salary-structures/', data)
  return res.data
}
