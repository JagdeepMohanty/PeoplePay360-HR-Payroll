import client from './client'

export const getPayruns = () => client.get('/payruns/').then(r => r.data)
export const createPayrun = (data) => client.post('/payruns/', data).then(r => r.data)
export const computePayrun = (id) => client.post(`/payruns/${id}/compute`).then(r => r.data)
export const validatePayrun = (id) => client.get(`/payruns/${id}/validate`).then(r => r.data)
export const confirmPayrun = (id) => client.post(`/payruns/${id}/confirm`).then(r => r.data)
export const payPayrun = (id) => client.post(`/payruns/${id}/pay`).then(r => r.data)
export const sendPayslipsEmail = (id) => client.post(`/payruns/${id}/send-payslips`).then(r => r.data)
export const getPayslipPdfUrl = (id) => `/api/v1/payruns/payslips/${id}/pdf`
