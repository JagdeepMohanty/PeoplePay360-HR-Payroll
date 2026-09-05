/**
 * Payslip API — Lucky's scope
 * Endpoints:
 *   getPayslips(payrunId)       → GET /payruns/{payrunId}/payslips
 *   downloadPayslipPdf(slipId)  → GET /payruns/payslips/{slipId}/pdf  (already exists on backend)
 */

import client from './client'

/**
 * Fetch all computed payslips for a given payrun.
 * NOTE: requires GET /payruns/{payrunId}/payslips backend endpoint.
 * Backend route to be added to backend/routers/payruns.py (shared file — approved).
 */
export const getPayslips = (payrunId) =>
  client.get(`/payruns/${payrunId}/payslips`).then(r => r.data)

/**
 * Download a single payslip as PDF blob.
 * Backend route already exists: GET /payruns/payslips/{payslipId}/pdf
 */
export const downloadPayslipPdf = (payslipId) =>
  client.get(`/payruns/payslips/${payslipId}/pdf`, { responseType: 'blob' }).then(r => r.data)
