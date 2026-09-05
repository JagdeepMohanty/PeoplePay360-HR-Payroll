import client from './client'

export const createPayrun = (data) => client.post('/payruns/wizard', data).then(r => r.data)
export const computePayrun = (id) => client.post(`/payruns/${id}/compute`).then(r => r.data)
export const validatePayrun = (id) => client.get(`/payruns/${id}/validate`).then(r => r.data)
export const confirmPayrun = (id) => client.post(`/payruns/${id}/confirm`).then(r => r.data)
