import client from './client'

export const getEmployees = () => client.get('/employees/').then(r => r.data)
export const getEmployee = (id) => client.get(`/employees/${id}`).then(r => r.data)
export const createEmployee = (data) => client.post('/employees/', data).then(r => r.data)
export const updateEmployee = (id, data) => client.put(`/employees/${id}`, data).then(r => r.data)
export const getEmployeeSmartButtons = (id) => client.get(`/employees/${id}/smart-buttons`).then(r => r.data)
