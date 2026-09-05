/**
 * @typedef {Object} Payrun
 * @property {number} id
 * @property {string} name
 * @property {string} period_start
 * @property {string} period_end
 * @property {string} [department]
 * @property {'draft' | 'computed' | 'confirmed' | 'cancelled'} state
 * @property {number} total_gross
 * @property {number} total_net
 * @property {number} employee_count
 * @property {string} created_at
 */

/**
 * @typedef {Object} PayslipLine
 * @property {number} id
 * @property {number} payslip_id
 * @property {string} code - e.g., 'BASIC', 'HRA', 'PF', 'TAX'
 * @property {string} name - Human readable description
 * @property {'basic' | 'allowance' | 'deduction' | 'net'} category
 * @property {number} amount
 * @property {number} [rate]
 * @property {boolean} is_deduction
 */

/**
 * @typedef {Object} Payslip
 * @property {number} id
 * @property {number} payrun_id
 * @property {number} employee_id
 * @property {string} employee_name
 * @property {string} department
 * @property {string} job_title
 * @property {string} period_start
 * @property {string} period_end
 * @property {number} basic_pay
 * @property {number} gross_pay
 * @property {number} total_deductions
 * @property {number} net_pay
 * @property {PayslipLine[]} lines
 * @property {'draft' | 'computed' | 'confirmed'} state
 * @property {string} created_at
 */

/**
 * @typedef {Object} SalaryRule
 * @property {number} id
 * @property {string} code
 * @property {string} name
 * @property {'basic' | 'allowance' | 'deduction'} category
 * @property {number} sequence
 * @property {'fixed' | 'percentage'} amount_type
 * @property {number} [amount_fix]
 * @property {number} [amount_percentage]
 * @property {boolean} active
 */

/**
 * @typedef {Object} SalaryStructure
 * @property {number} id
 * @property {string} name
 * @property {string} code
 * @property {SalaryRule[]} rules
 */

/**
 * @typedef {Object} PayrollWarning
 * @property {number} id
 * @property {'critical' | 'warning' | 'info'} severity
 * @property {string} type - e.g. 'MISSING_BANK', 'CONCURRENT_CONTRACT', 'DUPLICATE_PAYSLIP'
 * @property {string} message
 * @property {number} [employee_id]
 * @property {string} [employee_name]
 * @property {number} [payrun_id]
 */

/**
 * @typedef {Object} DashboardMetrics
 * @property {number} total_gross
 * @property {number} total_net
 * @property {number} total_deductions
 * @property {number} active_employees
 * @property {number} processed_payruns
 * @property {number} pending_warnings
 * @property {Record<string, { gross: number, net: number, deductions: number }>} by_department
 */

/**
 * @typedef {Object} DepartmentPayroll
 * @property {string} department
 * @property {number} gross
 * @property {number} net
 * @property {number} deductions
 * @property {number} employee_count
 */

/**
 * @typedef {Object} MonthlyPayrollTrend
 * @property {string} month
 * @property {number} gross
 * @property {number} net
 * @property {number} deductions
 */

export const PAYROLL_STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  computed: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

export const WARNING_SEVERITY_STYLES = {
  critical: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}
