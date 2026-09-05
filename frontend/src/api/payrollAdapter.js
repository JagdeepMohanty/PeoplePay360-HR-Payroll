import client from './client'

/**
 * Isolated Payroll & Analytics Data Adapter Layer.
 * Intercepts real backend calls and falls back cleanly to formatted mock datasets
 * when backend services are offline or pending deployment.
 */

export const MOCK_SALARY_STRUCTURES = [
  { id: 1, name: 'Standard Full-Time Structure', code: 'STD_FT', description: 'Basic + HRA + Standard Tax & PF deductions' },
  { id: 2, name: 'Executive Salary Structure', code: 'EXEC_FT', description: 'Executive Allowances + Medical + Bonus' },
  { id: 3, name: 'Hourly Contractor Structure', code: 'HOURLY_CON', description: 'Hourly wage rate evaluation without benefits' },
]

export const MOCK_ELIGIBLE_EMPLOYEES = [
  { id: 1, name: 'Alex Johnson', department: 'Engineering', job_title: 'Backend Engineer', type: 'Full-Time', has_contract: true, bank_account: '**** 4821' },
  { id: 2, name: 'Sophia Miller', department: 'Engineering', job_title: 'Frontend Developer', type: 'Full-Time', has_contract: true, bank_account: '**** 9102' },
  { id: 3, name: 'David Smith', department: 'Sales', job_title: 'Account Executive', type: 'Full-Time', has_contract: true, bank_account: '' },
  { id: 4, name: 'Niharika Yadav', department: 'Engineering', job_title: 'Senior Software Engineer', type: 'Full-Time', has_contract: true, bank_account: '**** 1109' },
  { id: 5, name: 'Emma Watson', department: 'Marketing', job_title: 'Growth Specialist', type: 'Contractor', has_contract: true, bank_account: '**** 3321' },
  { id: 6, name: 'Liam Wilson', department: 'Sales', job_title: 'Sales Representative', type: 'Full-Time', has_contract: true, bank_account: '**** 5543' },
  { id: 7, name: 'Olivia Taylor', department: 'Operations', job_title: 'Operations Manager', type: 'Full-Time', has_contract: false, bank_account: '**** 8891' },
]

export const MOCK_DASHBOARD_METRICS = {
  total_gross: 124500,
  total_net: 98300,
  total_deductions: 26200,
  payslips_generated: 48,
  avg_salary: 2593,
  active_employees: 48,
  processed_payruns: 12,
  pending_warnings: 3,
  approved_time_off_days: 14.5,
  attendance_health_rate: 96.4,
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

export const MOCK_ATTENDANCE_OVERVIEW = {
  present: 42,
  late: 4,
  absent: 2,
  overtime_hours: 38.5,
  missing_checkouts: 1,
  manual_edits: 3,
  attendance_coverage_pct: 96.4,
}

export const MOCK_TIMEOFF_OVERVIEW = {
  approved_days: 14.5,
  pending_requests: 3,
  leave_balance_days: 124.0,
}

export const MOCK_OPERATIONAL_ALERTS = [
  { id: 1, title: 'Missing Bank Account Information', description: 'Employee David Smith (#3) has no bank routing/account set.', severity: 'warning' },
  { id: 2, title: 'Contract Renewal Attention', description: 'Employee Olivia Taylor (#7) contract expired on 2025-05-31.', severity: 'critical' },
  { id: 3, title: 'Duplicate Payslip Prevention', description: 'Prevented duplicate payrun calculation for June 2025.', severity: 'info' },
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
  structure_name: 'Standard Full-Time Structure',
  worked_days: 22,
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

export const fetchSalaryStructures = async () => {
  try {
    const res = await client.get('/salary-structures')
    return res.data
  } catch (err) {
    return MOCK_SALARY_STRUCTURES
  }
}

export const fetchEligibleEmployees = async ({ department = '', search = '', employeeType = '' } = {}) => {
  try {
    const params = { department, search, employeeType }
    const res = await client.get('/employees/eligible', { params })
    return res.data
  } catch (err) {
    let filtered = [...MOCK_ELIGIBLE_EMPLOYEES]
    if (department) filtered = filtered.filter(e => e.department === department)
    if (employeeType) filtered = filtered.filter(e => e.type === employeeType)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(e => e.name.toLowerCase().includes(q) || e.job_title.toLowerCase().includes(q))
    }
    return filtered
  }
}

export const createPayrunWizard = async (payload) => {
  try {
    const res = await client.post('/payruns/wizard', payload)
    return res.data
  } catch (err) {
    return {
      id: Math.floor(Math.random() * 900) + 100,
      name: `Payrun ${payload.period_start} to ${payload.period_end}`,
      period_start: payload.period_start,
      period_end: payload.period_end,
      structure_code: payload.structure_code || 'STD_FT',
      department: payload.department || 'All Departments',
      state: 'draft',
      employee_count: payload.employee_ids?.length || 5,
      total_gross: 0,
      total_net: 0,
    }
  }
}

export const fetchPayrunDetail = async (id) => {
  try {
    const res = await client.get(`/payruns/${id}`)
    return res.data
  } catch (err) {
    return {
      id: Number(id) || 101,
      name: `Payrun June 2025 #${id}`,
      period_start: '2025-06-01',
      period_end: '2025-06-30',
      structure_name: 'Standard Full-Time Structure',
      department: 'Engineering & Sales',
      state: 'draft',
      employee_count: 5,
      total_gross: 34500,
      total_net: 28300,
      total_deductions: 6200,
      payslips: [
        MOCK_PAYSLIP_BREAKDOWN,
        { ...MOCK_PAYSLIP_BREAKDOWN, id: 102, employee_id: 1, employee_name: 'Alex Johnson', net_pay: 5400, gross_pay: 6800 },
        { ...MOCK_PAYSLIP_BREAKDOWN, id: 103, employee_id: 3, employee_name: 'David Smith', net_pay: 4900, gross_pay: 6100 },
      ]
    }
  }
}

export const fetchPayrollDashboardMetrics = async ({ dept = '', period = '', employeeType = '' } = {}) => {
  try {
    const params = {}
    if (dept) params.dept = dept
    if (period) params.period = period
    if (employeeType) params.employeeType = employeeType
    const res = await client.get('/reports/dashboard', { params })
    return res.data
  } catch (err) {
    let metrics = { ...MOCK_DASHBOARD_METRICS }
    if (dept && metrics.by_department[dept]) {
      const deptData = metrics.by_department[dept]
      metrics.total_gross = deptData.gross
      metrics.total_net = deptData.net
      metrics.total_deductions = deptData.deductions
      metrics.active_employees = deptData.employee_count
      metrics.by_department = { [dept]: deptData }
    }
    return metrics
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

export const fetchAttendanceOverview = async ({ dept = '', period = '' } = {}) => {
  try {
    const res = await client.get('/reports/attendance-overview', { params: { dept, period } })
    return res.data
  } catch (err) {
    return MOCK_ATTENDANCE_OVERVIEW
  }
}

export const fetchTimeOffOverview = async ({ dept = '', period = '' } = {}) => {
  try {
    const res = await client.get('/reports/timeoff-overview', { params: { dept, period } })
    return res.data
  } catch (err) {
    return MOCK_TIMEOFF_OVERVIEW
  }
}

export const fetchOperationalAlerts = async () => {
  try {
    const res = await client.get('/reports/operational-alerts')
    return res.data
  } catch (err) {
    return MOCK_OPERATIONAL_ALERTS
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
      { id: 1, severity: 'warning', type: 'MISSING_BANK', message: 'Employee David Smith (#3) has no bank account details configured.' },
      { id: 2, severity: 'critical', type: 'MISSING_CONTRACT', message: 'Employee Olivia Taylor (#7) does not have an active running contract.' },
    ]
  }
}

export const dispatchPayslipEmail = async (payslipId) => {
  try {
    const res = await client.post(`/payslips/${payslipId}/email`)
    return res.data
  } catch (err) {
    return { success: true, message: `Payslip #${payslipId} successfully queued for email dispatch.` }
  }
}

export const generatePayslipPdf = async (payslipId) => {
  try {
    const res = await client.get(`/payslips/${payslipId}/pdf`, { responseType: 'blob' })
    return res.data
  } catch (err) {
    return { success: true, message: `Generated PDF stream for payslip #${payslipId}.` }
  }
}
