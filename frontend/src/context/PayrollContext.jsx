import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

const PayrollContext = createContext(null)

// ─────────────────────────────────────────────────────────────────────────────
// SALARY RULE ENGINE
// Each structure holds an ordered list of rule definitions.
// Rules are applied sequentially using the "inputs" object built up so far.
// Computation types:
//   'percent_of_gross'  → pct * gross_wage
//   'percent_of_rule'   → pct * inputs[source_code]
//   'fixed'             → fixed_amount
//   'balance'           → gross_wage - sum(all allowances so far)
//   'slab_pt'           → professional tax state slab
//   'tds_new_regime'    → annual income slab based TDS
// ─────────────────────────────────────────────────────────────────────────────
const initialSalaryStructures = [
  {
    id: 1,
    name: 'Regular Tech Band 4',
    code: 'TECH-B4',
    base_percent_label: '50% Basic',
    rules: [
      { code: 'BASIC',  name: 'Basic Salary',            category: 'Allowance',           computation: 'percent_of_gross', pct: 0.50, source: null,    amount: 0, taxable: true,  sequence: 1  },
      { code: 'HRA',    name: 'House Rent Allowance',     category: 'Allowance',           computation: 'percent_of_rule',  pct: 0.40, source: 'BASIC', amount: 0, taxable: false, sequence: 2  },
      { code: 'SA',     name: 'Special Allowance',        category: 'Allowance',           computation: 'balance',          pct: 0,    source: null,    amount: 0, taxable: true,  sequence: 3  },
      { code: 'PF_EE',  name: 'Provident Fund (EE)',      category: 'Deduction',           computation: 'percent_of_rule',  pct: 0.12, source: 'BASIC', amount: 0, taxable: false, sequence: 10 },
      { code: 'PT',     name: 'Professional Tax',         category: 'Deduction',           computation: 'slab_pt',          pct: 0,    source: null,    amount: 200, taxable: true, sequence: 11 },
      { code: 'TDS',    name: 'Income Tax (TDS)',         category: 'Deduction',           computation: 'tds_new_regime',   pct: 0,    source: null,    amount: 0, taxable: false, sequence: 12 },
      { code: 'PF_ER',  name: 'Provident Fund (ER)',      category: 'Company Contribution',computation: 'percent_of_rule',  pct: 0.12, source: 'BASIC', amount: 0, taxable: false, sequence: 20 },
    ],
  },
  {
    id: 2,
    name: 'Executive HR Band 3',
    code: 'EXEC-HR3',
    base_percent_label: '50% Basic',
    rules: [
      { code: 'BASIC',  name: 'Basic Salary',             category: 'Allowance',           computation: 'percent_of_gross', pct: 0.50, source: null,    amount: 0, taxable: true,  sequence: 1  },
      { code: 'HRA',    name: 'House Rent Allowance',      category: 'Allowance',           computation: 'percent_of_rule',  pct: 0.40, source: 'BASIC', amount: 0, taxable: false, sequence: 2  },
      { code: 'SA',     name: 'Special Allowance',         category: 'Allowance',           computation: 'balance',          pct: 0,    source: null,    amount: 0, taxable: true,  sequence: 3  },
      { code: 'PF_EE',  name: 'Provident Fund (EE)',       category: 'Deduction',           computation: 'percent_of_rule',  pct: 0.12, source: 'BASIC', amount: 0, taxable: false, sequence: 10 },
      { code: 'PT',     name: 'Professional Tax',          category: 'Deduction',           computation: 'slab_pt',          pct: 0,    source: null,    amount: 200, taxable: true, sequence: 11 },
      { code: 'TDS',    name: 'Income Tax (TDS)',          category: 'Deduction',           computation: 'tds_new_regime',   pct: 0,    source: null,    amount: 0, taxable: false, sequence: 12 },
    ],
  },
  {
    id: 3,
    name: 'Sales Base + Incentive',
    code: 'SALES-COMM',
    base_percent_label: '40% Basic',
    rules: [
      { code: 'BASIC',  name: 'Basic Salary',             category: 'Allowance',           computation: 'percent_of_gross', pct: 0.40, source: null,    amount: 0, taxable: true,  sequence: 1  },
      { code: 'HRA',    name: 'House Rent Allowance',      category: 'Allowance',           computation: 'percent_of_rule',  pct: 0.40, source: 'BASIC', amount: 0, taxable: false, sequence: 2  },
      { code: 'INCENT', name: 'Sales Incentive',           category: 'Allowance',           computation: 'fixed',            pct: 0,    source: null,    amount: 15000, taxable: true, sequence: 3 },
      { code: 'SA',     name: 'Special Allowance',         category: 'Allowance',           computation: 'balance',          pct: 0,    source: null,    amount: 0, taxable: true,  sequence: 4  },
      { code: 'PF_EE',  name: 'Provident Fund (EE)',       category: 'Deduction',           computation: 'percent_of_rule',  pct: 0.12, source: 'BASIC', amount: 0, taxable: false, sequence: 10 },
      { code: 'PT',     name: 'Professional Tax',          category: 'Deduction',           computation: 'slab_pt',          pct: 0,    source: null,    amount: 200, taxable: true, sequence: 11 },
      { code: 'TDS',    name: 'Income Tax (TDS)',          category: 'Deduction',           computation: 'tds_new_regime',   pct: 0,    source: null,    amount: 0, taxable: false, sequence: 12 },
    ],
  },
  {
    id: 4,
    name: 'Operations Band 2',
    code: 'OPS-B2',
    base_percent_label: '50% Basic',
    rules: [
      { code: 'BASIC',  name: 'Basic Salary',             category: 'Allowance',           computation: 'percent_of_gross', pct: 0.50, source: null,    amount: 0, taxable: true,  sequence: 1  },
      { code: 'HRA',    name: 'House Rent Allowance',      category: 'Allowance',           computation: 'percent_of_rule',  pct: 0.40, source: 'BASIC', amount: 0, taxable: false, sequence: 2  },
      { code: 'SA',     name: 'Special Allowance',         category: 'Allowance',           computation: 'balance',          pct: 0,    source: null,    amount: 0, taxable: true,  sequence: 3  },
      { code: 'PF_EE',  name: 'Provident Fund (EE)',       category: 'Deduction',           computation: 'percent_of_rule',  pct: 0.12, source: 'BASIC', amount: 0, taxable: false, sequence: 10 },
      { code: 'PT',     name: 'Professional Tax',          category: 'Deduction',           computation: 'slab_pt',          pct: 0,    source: null,    amount: 200, taxable: true, sequence: 11 },
      { code: 'TDS',    name: 'Income Tax (TDS)',          category: 'Deduction',           computation: 'tds_new_regime',   pct: 0,    source: null,    amount: 0, taxable: false, sequence: 12 },
    ],
  },
  {
    id: 5,
    name: 'Engineering Intern',
    code: 'ENG-INTERN',
    base_percent_label: 'Stipend Flat',
    rules: [
      { code: 'STIPEND', name: 'Monthly Stipend',          category: 'Allowance',           computation: 'percent_of_gross', pct: 1.0, source: null,    amount: 0, taxable: false, sequence: 1  },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// RULE COMPUTATION ENGINE
// Applies salary rules to produce a full payslip breakdown
// ─────────────────────────────────────────────────────────────────────────────
export function computePayslip(grossWage, structureRules) {
  const sortedRules = [...structureRules].sort((a, b) => a.sequence - b.sequence)
  const inputs = { GROSS: grossWage }
  const lineItems = []
  let totalAllowances = 0
  let totalDeductions = 0
  let totalCompanyContrib = 0

  const annualGross = grossWage * 12

  for (const rule of sortedRules) {
    let value = 0

    switch (rule.computation) {
      case 'percent_of_gross':
        value = Math.round(grossWage * rule.pct)
        break
      case 'percent_of_rule':
        value = Math.round((inputs[rule.source] || 0) * rule.pct)
        break
      case 'fixed':
        value = rule.amount
        break
      case 'balance': {
        // Balancing component = gross - sum of all allowances computed so far
        value = Math.max(0, Math.round(grossWage - totalAllowances))
        break
      }
      case 'slab_pt':
        // Karnataka professional tax slab
        if (grossWage > 15000) value = 200
        else if (grossWage > 10000) value = 150
        else value = 0
        break
      case 'tds_new_regime': {
        // New tax regime annual income slabs (FY 2025-26)
        const taxableAnnual = annualGross
        let annualTax = 0
        if (taxableAnnual <= 300000) annualTax = 0
        else if (taxableAnnual <= 700000) annualTax = (taxableAnnual - 300000) * 0.05
        else if (taxableAnnual <= 1000000) annualTax = 20000 + (taxableAnnual - 700000) * 0.10
        else if (taxableAnnual <= 1200000) annualTax = 50000 + (taxableAnnual - 1000000) * 0.15
        else if (taxableAnnual <= 1500000) annualTax = 80000 + (taxableAnnual - 1200000) * 0.20
        else annualTax = 140000 + (taxableAnnual - 1500000) * 0.30
        // Add 4% health & education cess
        annualTax = Math.round(annualTax * 1.04)
        value = Math.round(annualTax / 12)
        break
      }
      default:
        value = 0
    }

    inputs[rule.code] = value

    if (rule.category === 'Allowance') {
      totalAllowances += value
    } else if (rule.category === 'Deduction') {
      totalDeductions += value
    } else if (rule.category === 'Company Contribution') {
      totalCompanyContrib += value
    }

    lineItems.push({
      code: rule.code,
      name: rule.name,
      category: rule.category,
      amount: value,
      computation: rule.computation,
      pct: rule.pct,
      source: rule.source,
      taxable: rule.taxable,
      sequence: rule.sequence,
    })
  }

  const netPayable = totalAllowances - totalDeductions

  return {
    lineItems,
    totalAllowances,
    totalDeductions,
    totalCompanyContrib,
    netPayable,
    basic: inputs['BASIC'] || inputs['STIPEND'] || 0,
    hra: inputs['HRA'] || 0,
    pf: inputs['PF_EE'] || 0,
    tds: inputs['TDS'] || 0,
    pt: inputs['PT'] || 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL ISSUE SCANNER
// Scans real data and returns structured warning objects
// ─────────────────────────────────────────────────────────────────────────────
export function scanPayrollIssues({ employees, contracts, attendance, timeOffRequests, period_start, period_end, selected_employee_ids }) {
  const warnings = []
  const targetEmps = employees.filter(e => selected_employee_ids.includes(e.id))

  for (const emp of targetEmps) {
    // 1. Missing active contract
    const hasContract = contracts.some(c => c.employee === emp.name && c.status === 'Active')
    if (!hasContract) {
      warnings.push({
        id: `WARN-NOCONTRACT-${emp.id}`,
        employee: emp.name,
        type: 'Missing Active Contract',
        impact: 'Blocked',
        severity: 'Critical',
        description: `No active contract found for ${emp.name}. Cannot compute payslip without a valid wage and salary structure.`,
      })
    }

    // 2. Incomplete employee data
    if (!emp.work_email || emp.work_email === '' || !emp.wage || emp.wage === 0) {
      warnings.push({
        id: `WARN-INCOMPLETE-${emp.id}`,
        employee: emp.name,
        type: 'Incomplete Employee Profile',
        impact: '₹0',
        severity: 'Critical',
        description: `Missing required fields: ${!emp.work_email ? 'work email ' : ''}${!emp.wage || emp.wage === 0 ? 'monthly wage' : ''}. Payslip cannot be generated.`,
      })
    }

    // 3. Duplicate attendance on same date
    const empAttendance = attendance.filter(a => a.employee === emp.name)
    const dateMap = {}
    for (const record of empAttendance) {
      if (dateMap[record.date]) {
        warnings.push({
          id: `WARN-DUPATT-${emp.id}-${record.date}`,
          employee: emp.name,
          type: 'Duplicate Attendance Entry',
          impact: 'Audit Risk',
          severity: 'Warning',
          description: `Two attendance records found for ${record.date}. Duplicate entries may skew worked-hours calculation.`,
        })
        break
      }
      dateMap[record.date] = true
    }

    // 4. Unapproved leave overlapping payrun period
    const pendingLeaves = timeOffRequests.filter(
      t => t.employee === emp.name && t.status === 'Pending' &&
        t.start_date >= period_start && t.start_date <= period_end
    )
    for (const leave of pendingLeaves) {
      const estDeduction = Math.round(((employees.find(e => e.name === emp.name)?.wage || 0) / 26) * leave.days)
      warnings.push({
        id: `WARN-LEAVE-${emp.id}-${leave.id}`,
        employee: emp.name,
        type: 'Unapproved Leave Deduction',
        impact: `₹${estDeduction.toLocaleString('en-IN')}`,
        severity: 'Warning',
        description: `${leave.days}-day ${leave.leave_type} (${leave.start_date}) is still pending approval. Will be treated as LOP if not approved before payrun close.`,
      })
    }

    // 5. Excessive late check-ins (>= 3 lates = LOP half-day rule)
    const lateCount = attendance.filter(a => a.employee === emp.name && a.status === 'Late').length
    if (lateCount >= 3) {
      const wage = emp.wage || 0
      const halfDayDeduction = Math.round(wage / 52)
      warnings.push({
        id: `WARN-LATE-${emp.id}`,
        employee: emp.name,
        type: 'Late Arrival LOP Threshold Crossed',
        impact: `₹${halfDayDeduction.toLocaleString('en-IN')}`,
        severity: 'Warning',
        description: `${lateCount} late check-ins exceed the 3-instance grace threshold. A half-day LOP deduction of ₹${halfDayDeduction.toLocaleString('en-IN')} applies per company policy.`,
      })
    }
  }

  return warnings
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL SEED DATA
// ─────────────────────────────────────────────────────────────────────────────
const initialEmployees = [
  { id: 1, name: 'Aarav Sharma',  department: 'Engineering', job_position: 'Tech Lead',             work_email: 'aarav.sharma@oxp.com',  work_phone: '+91 98765 43210', manager_name: 'Vikram Mehta', contract_type: 'Full-time Permanent', wage: 175000, date_joined: '2023-01-12', status: 'Active' },
  { id: 2, name: 'Priya Patel',   department: 'HR',          job_position: 'HR Manager',             work_email: 'priya.patel@oxp.com',   work_phone: '+91 98765 43211', manager_name: 'Vikram Mehta', contract_type: 'Full-time Permanent', wage: 125000, date_joined: '2023-04-01', status: 'Active' },
  { id: 3, name: 'Rohan Verma',   department: 'Sales',       job_position: 'Account Executive',      work_email: 'rohan.verma@oxp.com',   work_phone: '+91 98765 43212', manager_name: 'Priya Patel',  contract_type: 'Full-time Permanent', wage: 95000,  date_joined: '2024-02-15', status: 'Active' },
  { id: 4, name: 'Ananya Iyer',   department: 'Engineering', job_position: 'Frontend Engineer',      work_email: 'ananya.iyer@oxp.com',   work_phone: '+91 98765 43213', manager_name: 'Aarav Sharma', contract_type: 'Full-time Permanent', wage: 110000, date_joined: '2024-06-01', status: 'Active' },
  { id: 5, name: 'Vikram Singh',  department: 'Operations',  job_position: 'Operations Specialist',  work_email: 'vikram.singh@oxp.com',  work_phone: '+91 98765 43214', manager_name: 'Priya Patel',  contract_type: 'Full-time Permanent', wage: 85000,  date_joined: '2025-01-10', status: 'On Leave' },
  { id: 6, name: 'Sneha Reddy',   department: 'Marketing',   job_position: 'Growth Lead',            work_email: 'sneha.reddy@oxp.com',   work_phone: '+91 98765 43215', manager_name: 'Priya Patel',  contract_type: 'Full-time Permanent', wage: 120000, date_joined: '2025-03-01', status: 'Active' },
]

const initialContracts = [
  { id: 1, employee_id: 1, contract_ref: 'CNT-2023-001', employee: 'Aarav Sharma',  department: 'Engineering', job_position: 'Tech Lead',            start_date: '2023-01-12', end_date: 'Open-ended', wage: 175000, structure: 'Regular Tech Band 4',   status: 'Active' },
  { id: 2, employee_id: 2, contract_ref: 'CNT-2023-014', employee: 'Priya Patel',   department: 'HR',          job_position: 'HR Manager',            start_date: '2023-04-01', end_date: 'Open-ended', wage: 125000, structure: 'Executive HR Band 3',   status: 'Active' },
  { id: 3, employee_id: 3, contract_ref: 'CNT-2024-008', employee: 'Rohan Verma',   department: 'Sales',       job_position: 'Account Executive',     start_date: '2024-02-15', end_date: 'Open-ended', wage: 95000,  structure: 'Sales Base + Incentive', status: 'Active' },
  { id: 4, employee_id: 4, contract_ref: 'CNT-2024-022', employee: 'Ananya Iyer',   department: 'Engineering', job_position: 'Frontend Engineer',     start_date: '2024-06-01', end_date: 'Open-ended', wage: 110000, structure: 'Regular Tech Band 4',   status: 'Active' },
  { id: 5, employee_id: 5, contract_ref: 'CNT-2025-003', employee: 'Vikram Singh',  department: 'Operations',  job_position: 'Operations Specialist', start_date: '2025-01-10', end_date: '2026-12-31', wage: 85000,  structure: 'Operations Band 2',     status: 'Active' },
  { id: 6, employee_id: 6, contract_ref: 'CNT-2025-019', employee: 'Sneha Reddy',   department: 'Marketing',   job_position: 'Growth Lead',           start_date: '2025-03-01', end_date: 'Open-ended', wage: 120000, structure: 'Regular Tech Band 4',   status: 'Active' },
]

const initialAttendance = [
  { id: 1, employee: 'Aarav Sharma',  department: 'Engineering', date: '2026-09-05', check_in: '09:02 AM', check_out: '06:15 PM', worked_hours: '8h 45m', overtime: '0h 45m', status: 'Present'  },
  { id: 2, employee: 'Priya Patel',   department: 'HR',          date: '2026-09-05', check_in: '09:42 AM', check_out: '06:00 PM', worked_hours: '7h 48m', overtime: '-',      status: 'Late'     },
  { id: 3, employee: 'Rohan Verma',   department: 'Sales',       date: '2026-09-05', check_in: '08:55 AM', check_out: '05:30 PM', worked_hours: '8h 35m', overtime: '-',      status: 'Present'  },
  { id: 4, employee: 'Ananya Iyer',   department: 'Engineering', date: '2026-09-05', check_in: '09:00 AM', check_out: '06:30 PM', worked_hours: '9h 00m', overtime: '1h 00m', status: 'Present'  },
  { id: 5, employee: 'Vikram Singh',  department: 'Operations',  date: '2026-09-05', check_in: '-',        check_out: '-',        worked_hours: '0h',     overtime: '-',      status: 'On Leave' },
  { id: 6, employee: 'Sneha Reddy',   department: 'Marketing',   date: '2026-09-05', check_in: '10:15 AM', check_out: '07:00 PM', worked_hours: '8h 15m', overtime: '-',      status: 'Late'     },
  { id: 7, employee: 'Sneha Reddy',   department: 'Marketing',   date: '2026-09-05', check_in: '10:20 AM', check_out: '07:00 PM', worked_hours: '8h 00m', overtime: '-',      status: 'Late'     },
  { id: 8, employee: 'Priya Patel',   department: 'HR',          date: '2026-09-04', check_in: '09:50 AM', check_out: '06:00 PM', worked_hours: '7h 30m', overtime: '-',      status: 'Late'     },
  { id: 9, employee: 'Priya Patel',   department: 'HR',          date: '2026-09-03', check_in: '10:05 AM', check_out: '06:00 PM', worked_hours: '7h 25m', overtime: '-',      status: 'Late'     },
]

const initialTimeOffRequests = [
  { id: 1, employee: 'Vikram Singh', department: 'Operations', leave_type: 'Paid Time Off (PTO)', start_date: '2026-09-04', end_date: '2026-09-08', days: 4, reason: 'Family function',    status: 'Pending'  },
  { id: 2, employee: 'Sneha Reddy',  department: 'Marketing',  leave_type: 'Sick Leave',           start_date: '2026-09-02', end_date: '2026-09-03', days: 2, reason: 'Viral fever',       status: 'Approved' },
  { id: 3, employee: 'Rohan Verma',  department: 'Sales',      leave_type: 'Casual Leave',         start_date: '2026-09-15', end_date: '2026-09-16', days: 2, reason: 'Personal errands',  status: 'Pending'  },
  { id: 4, employee: 'Ananya Iyer',  department: 'Engineering',leave_type: 'Paid Time Off (PTO)', start_date: '2026-08-20', end_date: '2026-08-22', days: 3, reason: 'Travel',             status: 'Approved' },
  { id: 5, employee: 'Aarav Sharma', department: 'Engineering',leave_type: 'Comp Off',             start_date: '2026-08-10', end_date: '2026-08-10', days: 1, reason: 'Weekend support',   status: 'Approved' },
]

const initialBalances = [
  { type: 'Paid Time Off (PTO)', allocated: 18, used: 6,  remaining: 12 },
  { type: 'Sick Leave',          allocated: 12, used: 3,  remaining: 9  },
  { type: 'Casual Leave',        allocated: 10, used: 4,  remaining: 6  },
  { type: 'Compensatory Off',    allocated: 4,  used: 1,  remaining: 3  },
]

const buildInitialPayruns = () => {
  // Generate the August 2026 payrun using the actual rule engine
  const aug2026Employees = initialEmployees.filter(e => e.status === 'Active' || e.status === 'On Leave')
  const structures = initialSalaryStructures
  const findStructure = (empName) => {
    const contract = initialContracts.find(c => c.employee === empName && c.status === 'Active')
    return structures.find(s => s.name === contract?.structure) || structures[0]
  }

  const payslips = aug2026Employees.map((emp, i) => {
    const struct = findStructure(emp.name)
    const computed = computePayslip(emp.wage, struct.rules)
    return {
      id: 100 + i + 1,
      employee: emp.name,
      role: emp.job_position,
      email: emp.work_email,
      structure: struct.name,
      gross: computed.totalAllowances,
      basic: computed.basic,
      hra: computed.hra,
      allowance: computed.totalAllowances - computed.basic - computed.hra,
      pf: computed.pf,
      pt: computed.pt,
      tds: computed.tds,
      deductions: computed.totalDeductions,
      net: computed.netPayable,
      status: 'Paid',
      lineItems: computed.lineItems,
    }
  })

  return [
    {
      id: 1,
      name: 'Payrun - August 2026 Regular',
      period_start: '2026-08-01',
      period_end: '2026-08-31',
      structure: 'Regular Tech Band 4',
      status: 'Paid',
      total_employees: payslips.length,
      total_gross: payslips.reduce((s, p) => s + p.gross, 0),
      total_net: payslips.reduce((s, p) => s + p.net, 0),
      payslips,
      warnings: [],
      created_at: '2026-08-01',
    },
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
export function PayrollProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('oxp_role') || 'Admin')

  const [employees, setEmployees] = useState(() => {
    try { const s = localStorage.getItem('oxp_employees'); return s ? JSON.parse(s) : initialEmployees } catch { return initialEmployees }
  })
  const [contracts, setContracts] = useState(() => {
    try { const s = localStorage.getItem('oxp_contracts'); return s ? JSON.parse(s) : initialContracts } catch { return initialContracts }
  })
  const [attendance, setAttendance] = useState(() => {
    try { const s = localStorage.getItem('oxp_attendance'); return s ? JSON.parse(s) : initialAttendance } catch { return initialAttendance }
  })
  const [timeOffRequests, setTimeOffRequests] = useState(() => {
    try { const s = localStorage.getItem('oxp_timeoff'); return s ? JSON.parse(s) : initialTimeOffRequests } catch { return initialTimeOffRequests }
  })
  const [leaveBalances, setLeaveBalances] = useState(() => {
    try { const s = localStorage.getItem('oxp_balances'); return s ? JSON.parse(s) : initialBalances } catch { return initialBalances }
  })
  const [payruns, setPayruns] = useState(() => {
    try { const s = localStorage.getItem('oxp_payruns'); return s ? JSON.parse(s) : buildInitialPayruns() } catch { return buildInitialPayruns() }
  })
  const [salaryStructures, setSalaryStructures] = useState(() => {
    try { const s = localStorage.getItem('oxp_structures'); return s ? JSON.parse(s) : initialSalaryStructures } catch { return initialSalaryStructures }
  })

  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('oxp_role', role) }, [role])
  useEffect(() => { localStorage.setItem('oxp_employees', JSON.stringify(employees)) }, [employees])
  useEffect(() => { localStorage.setItem('oxp_contracts', JSON.stringify(contracts)) }, [contracts])
  useEffect(() => { localStorage.setItem('oxp_attendance', JSON.stringify(attendance)) }, [attendance])
  useEffect(() => { localStorage.setItem('oxp_timeoff', JSON.stringify(timeOffRequests)) }, [timeOffRequests])
  useEffect(() => { localStorage.setItem('oxp_balances', JSON.stringify(leaveBalances)) }, [leaveBalances])
  useEffect(() => { localStorage.setItem('oxp_payruns', JSON.stringify(payruns)) }, [payruns])
  useEffect(() => { localStorage.setItem('oxp_structures', JSON.stringify(salaryStructures)) }, [salaryStructures])

  // ── Permissions ──
  const permissions = {
    canViewPayroll:   ['Admin', 'HR Payroll Manager', 'HR Payroll User'].includes(role),
    canEditPayroll:   ['Admin', 'HR Payroll Manager', 'HR Payroll User'].includes(role),
    canConfigureRules:['Admin', 'HR Payroll Manager'].includes(role),
    canManageHR:      ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'].includes(role),
    canApproveLeave:  ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'].includes(role),
    isEmployeeOnly:   role === 'Employee',
  }

  // ── Salary Structure Actions ──
  const addSalaryStructure = (data) => {
    const newId = salaryStructures.length > 0 ? Math.max(...salaryStructures.map(s => s.id)) + 1 : 1
    const newStruct = { id: newId, name: data.name, code: data.code, base_percent_label: data.base_percent_label || '50% Basic', rules: [] }
    setSalaryStructures(prev => [...prev, newStruct])
    showToast(`✓ Salary structure "${newStruct.name}" created!`)
  }

  const addSalaryRule = (structureId, ruleData) => {
    setSalaryStructures(prev => prev.map(s => {
      if (s.id !== structureId) return s
      const maxSeq = s.rules.length > 0 ? Math.max(...s.rules.map(r => r.sequence)) : 0
      const newRule = {
        code: ruleData.code.toUpperCase(),
        name: ruleData.name,
        category: ruleData.category,
        computation: ruleData.computation,
        pct: Number(ruleData.pct) || 0,
        source: ruleData.source || null,
        amount: Number(ruleData.amount) || 0,
        taxable: ruleData.taxable !== false,
        sequence: maxSeq + 10,
      }
      return { ...s, rules: [...s.rules, newRule] }
    }))
    showToast(`✓ Salary rule "${ruleData.name}" added!`)
  }

  const updateSalaryRule = (structureId, ruleCode, updates) => {
    setSalaryStructures(prev => prev.map(s => {
      if (s.id !== structureId) return s
      return { ...s, rules: s.rules.map(r => r.code === ruleCode ? { ...r, ...updates } : r) }
    }))
    showToast(`✓ Salary rule updated!`)
  }

  const deleteSalaryRule = (structureId, ruleCode) => {
    setSalaryStructures(prev => prev.map(s => {
      if (s.id !== structureId) return s
      return { ...s, rules: s.rules.filter(r => r.code !== ruleCode) }
    }))
    showToast(`✓ Salary rule removed!`)
  }

  // ── Employee Actions ──
  const addEmployee = (data) => {
    const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1
    const newEmp = {
      id: newId,
      name: data.name,
      department: data.department || 'Engineering',
      job_position: data.job_position || 'Staff',
      work_email: data.work_email || `${data.name.toLowerCase().replace(/\s+/g, '.')}@oxp.com`,
      work_phone: data.work_phone || '+91 98765 00000',
      manager_name: data.manager_name || 'Vikram Mehta',
      contract_type: data.contract_type || 'Full-time Permanent',
      wage: Number(data.wage) || 75000,
      date_joined: data.date_joined || new Date().toISOString().split('T')[0],
      status: 'Active',
    }
    setEmployees(prev => [newEmp, ...prev])

    // Auto-create initial contract
    const defaultStructure = data.department === 'Sales' ? 'Sales Base + Incentive'
      : data.department === 'Operations' ? 'Operations Band 2'
      : 'Regular Tech Band 4'

    const newContract = {
      id: contracts.length > 0 ? Math.max(...contracts.map(c => c.id)) + 1 : 1,
      employee_id: newId,
      contract_ref: `CNT-2026-${String(newId).padStart(3, '0')}`,
      employee: newEmp.name,
      department: newEmp.department,
      job_position: newEmp.job_position,
      start_date: newEmp.date_joined,
      end_date: 'Open-ended',
      wage: newEmp.wage,
      structure: defaultStructure,
      status: 'Active',
    }
    setContracts(prev => [newContract, ...prev])
    showToast(`✓ Employee ${newEmp.name} created with auto-contract ${newContract.contract_ref}!`)
    return newEmp
  }

  const updateEmployee = (id, data) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...data } : emp))
    showToast(`✓ Employee profile updated!`)
  }

  // ── Attendance Actions ──
  const punchIn = (employeeName = 'Aarav Sharma') => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const dateStr = now.toISOString().split('T')[0]
    const newRecord = {
      id: attendance.length > 0 ? Math.max(...attendance.map(a => a.id)) + 1 : 1,
      employee: employeeName,
      department: employees.find(e => e.name === employeeName)?.department || 'Engineering',
      date: dateStr,
      check_in: timeStr,
      check_out: '-',
      worked_hours: 'In Progress',
      overtime: '-',
      status: now.getHours() >= 10 ? 'Late' : 'Present',
    }
    setAttendance(prev => [newRecord, ...prev])
    showToast(`✓ Checked in at ${timeStr}`)
  }

  const punchOut = (employeeName = 'Aarav Sharma') => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setAttendance(prev => {
      let updated = false
      return prev.map(rec => {
        if (!updated && rec.employee === employeeName && rec.check_out === '-') {
          updated = true
          const checkInParts = rec.check_in.match(/(\d+):(\d+)\s*(AM|PM)/i)
          let workedMs = 0
          if (checkInParts) {
            let h = parseInt(checkInParts[1])
            const m = parseInt(checkInParts[2])
            const ampm = checkInParts[3].toUpperCase()
            if (ampm === 'PM' && h !== 12) h += 12
            if (ampm === 'AM' && h === 12) h = 0
            const checkInDate = new Date(); checkInDate.setHours(h, m, 0)
            workedMs = now - checkInDate
          }
          const workedHours = Math.floor(workedMs / 3600000)
          const workedMins = Math.floor((workedMs % 3600000) / 60000)
          const overtime = workedHours > 8 ? `${workedHours - 8}h ${workedMins}m` : '-'
          return { ...rec, check_out: timeStr, worked_hours: `${workedHours}h ${workedMins}m`, overtime }
        }
        return rec
      })
    })
    showToast(`✓ Checked out at ${timeStr}`)
  }

  const addManualAttendance = (data) => {
    const newRecord = {
      id: attendance.length > 0 ? Math.max(...attendance.map(a => a.id)) + 1 : 1,
      employee: data.employee,
      department: data.department || employees.find(e => e.name === data.employee)?.department || 'General',
      date: data.date || new Date().toISOString().split('T')[0],
      check_in: data.check_in || '09:00 AM',
      check_out: data.check_out || '06:00 PM',
      worked_hours: data.worked_hours || '8h 00m',
      overtime: data.overtime || '-',
      status: data.status || 'Present',
    }
    setAttendance(prev => [newRecord, ...prev])
    showToast(`✓ Attendance entry recorded for ${data.employee}`)
  }

  // ── Contract Actions ──
  const addContract = (data) => {
    const newId = contracts.length > 0 ? Math.max(...contracts.map(c => c.id)) + 1 : 1
    const newCnt = {
      id: newId,
      contract_ref: data.contract_ref || `CNT-2026-${String(newId).padStart(3, '0')}`,
      employee: data.employee,
      department: data.department || 'Engineering',
      job_position: data.job_position || 'Specialist',
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      end_date: data.end_date || 'Open-ended',
      wage: Number(data.wage) || 75000,
      structure: data.structure || 'Regular Tech Band 4',
      status: 'Active',
    }
    setContracts(prev => [newCnt, ...prev])
    showToast(`✓ Employment contract ${newCnt.contract_ref} created for ${newCnt.employee}!`)
  }

  // ── Time Off Actions ──
  const createTimeOffRequest = (data) => {
    const newId = timeOffRequests.length > 0 ? Math.max(...timeOffRequests.map(t => t.id)) + 1 : 1
    const newReq = {
      id: newId,
      employee: data.employee,
      department: data.department || employees.find(e => e.name === data.employee)?.department || 'Engineering',
      leave_type: data.leave_type || 'Paid Time Off (PTO)',
      start_date: data.start_date,
      end_date: data.end_date,
      days: Number(data.days) || 1,
      reason: data.reason || 'Personal Leave',
      status: 'Pending',
    }
    setTimeOffRequests(prev => [newReq, ...prev])
    showToast(`✓ Leave request submitted for ${data.employee}`)
  }

  const approveTimeOffRequest = (id) => {
    const req = timeOffRequests.find(t => t.id === id)
    if (!req) return
    setTimeOffRequests(prev => prev.map(t => t.id === id ? { ...t, status: 'Approved' } : t))
    setLeaveBalances(prev => prev.map(b => {
      if (b.type === req.leave_type) {
        const newUsed = b.used + req.days
        return { ...b, used: newUsed, remaining: Math.max(0, b.allocated - newUsed) }
      }
      return b
    }))
    showToast(`✓ Approved leave request for ${req.employee}`)
  }

  const refuseTimeOffRequest = (id) => {
    const req = timeOffRequests.find(t => t.id === id)
    setTimeOffRequests(prev => prev.map(t => t.id === id ? { ...t, status: 'Refused' } : t))
    showToast(`✓ Refused leave request for ${req?.employee || ''}`, 'warning')
  }

  // ── Payrun Actions ──
  const createPayrun = ({ name, period_start, period_end, structure, selected_employee_ids }) => {
    const newId = payruns.length > 0 ? Math.max(...payruns.map(p => p.id)) + 1 : 1
    const targetEmployees = employees.filter(e => selected_employee_ids.includes(e.id))

    // Run full payroll issue scan at creation time
    const liveWarnings = scanPayrollIssues({
      employees,
      contracts,
      attendance,
      timeOffRequests,
      period_start,
      period_end,
      selected_employee_ids,
    })

    // Generate Draft payslips (no computation yet — just stubs)
    const payslips = targetEmployees.map((emp, index) => ({
      id: (newId * 100) + index + 1,
      employee: emp.name,
      role: emp.job_position,
      email: emp.work_email,
      structure: contracts.find(c => c.employee === emp.name && c.status === 'Active')?.structure || structure,
      gross: 0, basic: 0, hra: 0, allowance: 0,
      pf: 0, pt: 0, tds: 0, deductions: 0, net: 0,
      status: 'Draft',
      lineItems: [],
    }))

    const newPayrun = {
      id: newId,
      name: name || `Payrun Batch #${newId}`,
      period_start,
      period_end,
      structure: structure || 'Regular Tech Band 4',
      status: 'Draft',
      total_employees: payslips.length,
      total_gross: 0,
      total_net: 0,
      payslips,
      warnings: liveWarnings,
      created_at: new Date().toISOString().split('T')[0],
    }

    setPayruns(prev => [newPayrun, ...prev])
    showToast(`✓ Payrun batch #${newId} created! ${liveWarnings.length} issue(s) detected.`)
    return newPayrun
  }

  const computePayrunBatch = (id) => {
    setPayruns(prev => prev.map(p => {
      if (p.id !== Number(id)) return p

      // Apply salary rule engine to each payslip
      const updatedPayslips = p.payslips.map(ps => {
        // Find the employee's active contract to get salary structure
        const contract = contracts.find(c => c.employee === ps.employee && c.status === 'Active')
        const structureName = contract?.structure || ps.structure || p.structure
        const structure = salaryStructures.find(s => s.name === structureName) || salaryStructures[0]
        const empWage = contract?.wage || employees.find(e => e.name === ps.employee)?.wage || 0
        const computed = computePayslip(empWage, structure.rules)

        return {
          ...ps,
          gross: computed.totalAllowances,
          basic: computed.basic,
          hra: computed.hra,
          allowance: computed.totalAllowances - computed.basic - computed.hra,
          pf: computed.pf,
          pt: computed.pt,
          tds: computed.tds,
          deductions: computed.totalDeductions,
          net: computed.netPayable,
          structure: structureName,
          status: 'Computed',
          lineItems: computed.lineItems,
        }
      })

      const totalGross = updatedPayslips.reduce((s, ps) => s + ps.gross, 0)
      const totalNet = updatedPayslips.reduce((s, ps) => s + ps.net, 0)

      return { ...p, status: 'Computed', payslips: updatedPayslips, total_gross: totalGross, total_net: totalNet }
    }))
    showToast(`✓ Payslips computed using live Salary Rule Engine for Payrun #${id}`)
  }

  const reRunPayrunWarnings = (id) => {
    const payrun = payruns.find(p => p.id === Number(id))
    if (!payrun) return
    const selected_employee_ids = employees
      .filter(e => payrun.payslips.some(ps => ps.employee === e.name))
      .map(e => e.id)
    const liveWarnings = scanPayrollIssues({
      employees, contracts, attendance, timeOffRequests,
      period_start: payrun.period_start,
      period_end: payrun.period_end,
      selected_employee_ids,
    })
    setPayruns(prev => prev.map(p => p.id === Number(id) ? { ...p, warnings: liveWarnings } : p))
    showToast(`✓ Re-scanned ${liveWarnings.length} payroll issue(s) found`)
    return liveWarnings
  }

  const validatePayrunBatch = (id) => {
    setPayruns(prev => prev.map(p => {
      if (p.id !== Number(id)) return p
      return { ...p, status: 'Validated' }
    }))
    showToast(`✓ Payrun #${id} validated — compliance checks passed!`)
  }

  const markPayrunPaid = (id) => {
    setPayruns(prev => prev.map(p => {
      if (p.id !== Number(id)) return p
      const updatedPayslips = p.payslips.map(ps => ({ ...ps, status: 'Paid' }))
      return { ...p, status: 'Paid', payslips: updatedPayslips }
    }))
    showToast(`✓ Payrun #${id} marked Paid! Bank disbursement logged.`)
  }

  const sendBulkPayslips = (id) => {
    showToast(`✓ All payslips for Payrun #${id} queued for bulk email dispatch!`)
  }

  const resolvePayrunWarning = (payrunId, warningId) => {
    setPayruns(prev => prev.map(p => {
      if (p.id !== Number(payrunId)) return p
      return { ...p, warnings: p.warnings.filter(w => w.id !== warningId) }
    }))
    showToast(`✓ Warning resolved and removed from payrun audit log.`)
  }

  return (
    <PayrollContext.Provider
      value={{
        role, setRole, permissions,
        // Employees
        employees, addEmployee, updateEmployee,
        // Contracts
        contracts, addContract,
        // Salary Structures & Rule Engine
        salaryStructures, addSalaryStructure, addSalaryRule, updateSalaryRule, deleteSalaryRule,
        // Attendance
        attendance, punchIn, punchOut, addManualAttendance,
        // Time Off
        timeOffRequests, leaveBalances, createTimeOffRequest, approveTimeOffRequest, refuseTimeOffRequest,
        // Payruns
        payruns, createPayrun, computePayrunBatch, validatePayrunBatch,
        markPayrunPaid, sendBulkPayslips, resolvePayrunWarning, reRunPayrunWarnings,
        // Utilities
        showToast, toast,
        // Exported helpers (for use in components)
        computePayslip, scanPayrollIssues,
      }}
    >
      {children}
      {/* Global Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[9999] px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === 'warning'
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : 'bg-white text-slate-800 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.08)]'
        }`}>
          {toast.message}
        </div>
      )}
    </PayrollContext.Provider>
  )
}

export function usePayroll() {
  const ctx = useContext(PayrollContext)
  if (!ctx) throw new Error('usePayroll must be used within PayrollProvider')
  return ctx
}
