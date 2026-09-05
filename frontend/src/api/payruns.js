import client from './client'

export const getPayruns = async () => {
  const res = await client.get('/payruns')
  return res.data
}

export const getPayrun = async (payrunId) => {
  const res = await client.get(`/payruns/${payrunId}`)
  return res.data
}

export const createPayrunWizard = async (data) => {
  const res = await client.post('/payruns/wizard', data)
  return res.data
}

export const computePayrun = async (payrunId) => {
  const res = await client.post(`/payruns/${payrunId}/compute`)
  return res.data
}

export const validatePayrun = async (payrunId) => {
  const res = await client.get(`/payruns/${payrunId}/validate`)
  return res.data
}

export const confirmPayrun = async (payrunId) => {
  const res = await client.post(`/payruns/${payrunId}/confirm`)
  return res.data
}

export const getPayslipPdfUrl = (payslipId) => {
  const token = localStorage.getItem('token')
  const baseUrl = client.defaults.baseURL
  return `${baseUrl}/payruns/payslips/${payslipId}/pdf?token=${token}`
}

export const downloadPayslipPdfBlob = async (payslipId) => {
  const res = await client.get(`/payruns/payslips/${payslipId}/pdf`, {
    responseType: 'blob',
  })
  return res.data
}
