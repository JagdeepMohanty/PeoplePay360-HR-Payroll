import axios from 'axios'

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const detail = err.response?.data?.detail || err.message

    let friendlyMessage = detail

    if (!err.response) {
      friendlyMessage = 'Network Failure: Unable to connect to PeoplePay360 Backend Service.'
    } else if (status === 400) {
      friendlyMessage = `Bad Request (400): ${detail}`
    } else if (status === 401) {
      friendlyMessage = 'Unauthorized (401): Please authenticate to perform payroll operations.'
    } else if (status === 403) {
      friendlyMessage = 'Forbidden (403): You do not have permission to execute this payroll action.'
    } else if (status === 404) {
      friendlyMessage = `Not Found (404): ${detail}`
    } else if (status === 409) {
      friendlyMessage = `Conflict (409): ${detail}`
    } else if (status >= 500) {
      friendlyMessage = `Server Error (${status}): Internal Payroll Engine failure.`
    }

    err.friendlyMessage = friendlyMessage
    console.error(`[API Error ${status || 'NET'}]`, friendlyMessage)
    return Promise.reject(err)
  }
)

export default client
