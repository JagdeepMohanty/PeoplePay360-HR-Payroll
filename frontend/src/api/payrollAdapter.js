import client from './client'

/**
 * Isolated Payroll & Analytics Data Adapter Layer.
 * Intercepts real backend calls and falls back cleanly to formatted mock datasets
 * when backend services are offline or pending deployment.
 */

export const MOCK_DASHBOARD_METRICS = {
  total_gross: 124500,
  total_net: 98300,
  total_deductions: 26200,
  active_employees: 48,
  processed_payruns: 12,
  pending_warnings: 3,
  by_department: {
    Engineering: { gross: 55000, net: 43500, deductions: 11500, employee_count: 18 },
    Sales: { gross: 32000, net: 25200, deductions: 6800, employee_count: 14 },
    Marketing: { gross: 21000, net: 16600, deductions: 4400, employee_count: 9 },
    Operations: { gross: 16500, net: 13000, deductions: 3500, employee_count: 7 },
  },
}

export const MOCK_MONTHLY_TREND = [
  { month: 'Jan', gross: 110000, net: 87000, deductions: 23000 },
  { month: 'Feb', gross: 112000, net: 88500, deductions: 23500 },
  { month: 'Mar', gross: 115000, net: 91000, deductions: 24000 },
  { month: 'Apr', gross: 118000, net: 93200, deductions: 24800 },
  { month: 'May', gross: 121000, net: 95500, deductions: 25500 },
  { month: 'Jun', gross: 124500, net: 98300, deductions: 26200 },
]

export const MOCK_PAYSLIP_BREAKDOWN = {
  id: 101,
  payrun_id: 1,
  employee_id: 4,
  employee_name: 'Niharika Yadav',
  department: 'Engineering',
  job_title: 'Senior Software Engineer',
  period_start: '2025-06-01',
  period_end: '2025-06-30',
  basic_pay: 6000,
  gross_pay: 7500,
  total_deductions: 1350,
  net_pay: 6150,
  state: 'computed',
  created_at: '2025-06-30T10:00:00Z',
  lines: [
    { id: 1, code: 'BASIC', name: 'Basic Salary', category: 'basic', amount: 6000, rate: 1.0, is_deduction: false },
    { id: 2, code: 'HRA', name: 'House Rent Allowance', category: 'allowance', amount: 1000, rate: 1.0, is_deduction: false },
    { id: 3, code: 'BONUS', name: 'Performance Bonus', category: 'allowance', amount: 500, rate: 1.0, is_deduction: false },
    { id: 4, code: 'PF', name: 'Provident Fund (10%)', category: 'deduction', amount: 600, rate: 0.10, is_deduction: true },
    { id: 5, code: 'TAX', name: 'Income Tax (TDS)', category: 'deduction', amount: 750, rate: 0.10, is_deduction: true },
  ]
}

export const fetchPayrollDashboardMetrics = async ({ dept = '', period = '' } = {}) => {
  try {
    const params = {}
    if (dept) params.dept = dept
    if (period) params.period = period
    const res = await client.get('/reports/dashboard', { params })
    return res.data
  } catch (err) {
    console.warn('[PayrollAdapter] Backend endpoint unavailable, returning structured mock metrics', err.message)
    return MOCK_DASHBOARD_METRICS
  }
}

export const fetchMonthlyPayrollTrend = async () => {
  try {
    const res = await client.get('/reports/monthly-trend')
    return res.data
  } catch (err) {
    return MOCK_MONTHLY_TREND
  }
}

export const fetchPayslipDetail = async (payslipId) => {
  try {
    const res = await client.get(`/payslips/${payslipId}`)
    return res.data
  } catch (err) {
    return MOCK_PAYSLIP_BREAKDOWN
  }
}

export const fetchPayrollWarnings = async (payrunId) => {
  try {
    const res = await client.get(`/payruns/${payrunId}/validate`)
    return res.data?.warnings || []
  } catch (err) {
    return [
      { id: 1, severity: 'warning', type: 'MISSING_BANK', message: 'Employee Alex Johnson has no bank account configured.' },
      { id: 2, severity: 'critical', type: 'DUPLICATE_PAYSLIP', message: 'Duplicate payslip generated for Employee #12 in period 2025-06.' },
    ]
  }
}
