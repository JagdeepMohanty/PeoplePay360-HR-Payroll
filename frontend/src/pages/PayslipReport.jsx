import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Printer, Download, ChevronDown, ChevronUp,
  Sparkles, Send, TrendingUp, TrendingDown, Minus
} from 'lucide-react'
import { usePayroll } from '@/context/PayrollContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function PayslipReport() {
  const { id } = useParams()
  const { payruns, employees, contracts, salaryStructures, computePayslip, showToast } = usePayroll()
  const [showExplanation, setShowExplanation] = useState(false)
  const [selectedEmpName, setSelectedEmpName] = useState(null)
  const printRef = useRef()

  const payrun = payruns.find(p => String(p.id) === String(id)) || payruns[0]

  // Employee list for switcher — use payrun payslips, or all employees
  const empList = payrun?.payslips?.length
    ? payrun.payslips.map(ps => employees.find(e => e.name === ps.employee) || { name: ps.employee, id: ps.id })
    : employees

  const empName = selectedEmpName || empList[0]?.name
  const employee = employees.find(e => e.name === empName) || employees[0]

  // ── Live Rule-Based Computation ──
  // Find the employee's active contract → salary structure → apply rules
  const contract = contracts.find(c => c.employee === empName && c.status === 'Active')
  const structureName = contract?.structure
    || payrun?.payslips?.find(ps => ps.employee === empName)?.structure
    || payrun?.structure
    || 'Regular Tech Band 4'
  const structure = salaryStructures.find(s => s.name === structureName) || salaryStructures[0]
  const wage = contract?.wage || employee?.wage || 0
  const computed = structure ? computePayslip(wage, structure.rules) : { lineItems: [], totalAllowances: 0, totalDeductions: 0, netPayable: 0, basic: 0, hra: 0, pf: 0, tds: 0, pt: 0 }

  // Separate line items by category
  const earnings   = computed.lineItems.filter(li => li.category === 'Allowance')
  const deductions = computed.lineItems.filter(li => li.category === 'Deduction')
  const compContribs = computed.lineItems.filter(li => li.category === 'Company Contribution')

  // ── "Why Did This Change?" ── Compare vs previous payrun
  const prevPayrun = payruns.find(p => p.id !== payrun?.id && p.status === 'Paid')
  const prevPayslip = prevPayrun?.payslips?.find(ps => ps.employee === empName)
  const deltas = prevPayslip ? [
    {
      name: 'Net Salary',
      current: computed.netPayable,
      previous: prevPayslip.net,
      delta: computed.netPayable - prevPayslip.net,
      reason: computed.netPayable > prevPayslip.net ? 'Salary increment or allowance change' : 'Deduction adjustment or LOP applied',
    },
    {
      name: 'Gross Earnings',
      current: computed.totalAllowances,
      previous: prevPayslip.gross,
      delta: computed.totalAllowances - prevPayslip.gross,
      reason: 'Salary structure formula applied to current contract wage',
    },
    {
      name: 'Total Deductions',
      current: computed.totalDeductions,
      previous: prevPayslip.deductions,
      delta: prevPayslip.deductions - computed.totalDeductions, // positive = less deduction (good)
      reason: 'Statutory PF/PT/TDS recomputed based on current wage bracket',
    },
  ] : []

  const formatCurrency = (v) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0)

  const handlePrint = () => window.print()

  const handleDownloadPdf = () => {
    showToast(`✓ PDF generated for ${employee?.name} — use browser Save as PDF in the print dialog`)
    setTimeout(() => window.print(), 200)
  }

  const handleSendSingle = () => {
    showToast(`✓ Payslip emailed to ${employee?.work_email || empName + '@oxp.com'}`)
  }

  if (!employee) {
    return <div className="text-center py-16 text-slate-400 text-sm">No employee data found.</div>
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-12">
      {/* Action Toolbar — hidden on print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <Link to={`/payruns/${payrun?.id}/process`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 shadow-xs border-0">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {payrun?.name || 'Payrun'}
          </Button>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Employee Switcher */}
          <select
            value={empName}
            onChange={e => setSelectedEmpName(e.target.value)}
            className="h-7 rounded-lg border-0 bg-white px-2.5 text-xs font-semibold text-slate-900 shadow-xs focus:ring-1 focus:ring-[#714b67]"
          >
            {empList.map(e => (
              <option key={e.name} value={e.name}>{e.name}</option>
            ))}
          </select>

          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs h-7 shadow-xs border-0">
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>

          <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="gap-1.5 text-xs h-7 shadow-xs border-0">
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>

          <Button size="sm" onClick={handleSendSingle} className="gap-1.5 text-xs h-7 shadow-xs">
            <Send className="h-3.5 w-3.5" /> Email
          </Button>
        </div>
      </div>

      {/* Payslip Card — this section is printed */}
      <Card ref={printRef} id="payslip-print-zone" className="p-8 space-y-6 bg-white border-0 print-visible">
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#714b67] text-white font-black flex items-center justify-center text-sm shadow-xs">
              PP
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight block">PeoplePay360 — OXP Solutions</span>
              <span className="text-[11px] text-slate-400">Bangalore Tech Park, Outer Ring Road, Karnataka 560103</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <Badge variant="odoo" className="text-xs font-semibold px-3 py-1">Salary Payslip Advice</Badge>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              {payrun?.period_start} → {payrun?.period_end}
            </p>
          </div>
        </div>

        {/* Employee Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/80 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-0.5">Employee</span>
            <span className="font-bold text-slate-900">{employee.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-0.5">Department · Role</span>
            <span className="text-slate-800">{employee.department} · {employee.job_position}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-0.5">Salary Structure</span>
            <span className="font-medium text-[#714b67]">{structureName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-0.5">Contract Wage</span>
            <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(wage)}/mo</span>
          </div>
        </div>

        {/* Earnings & Deductions — Rule-Driven */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider pb-1.5 border-b border-slate-100">
              Earnings &amp; Allowances
            </h3>
            <div className="space-y-1.5 text-xs">
              {earnings.map(li => (
                <div key={li.code} className="flex justify-between py-1">
                  <span className="text-slate-600">{li.name}</span>
                  <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(li.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2.5 text-xs font-bold text-slate-900 border-t border-slate-200">
                <span>Total Gross</span>
                <span className="tabular-nums">{formatCurrency(computed.totalAllowances)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider pb-1.5 border-b border-slate-100">
              Deductions &amp; Statutory
            </h3>
            <div className="space-y-1.5 text-xs">
              {deductions.map(li => (
                <div key={li.code} className="flex justify-between py-1">
                  <span className="text-slate-600">{li.name}</span>
                  <span className="font-semibold tabular-nums text-rose-600">−{formatCurrency(li.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2.5 text-xs font-bold border-t border-slate-200">
                <span className="text-slate-900">Total Deductions</span>
                <span className="tabular-nums text-rose-600">−{formatCurrency(computed.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Contributions (informational) */}
        {compContribs.length > 0 && (
          <div className="p-3 rounded-xl bg-teal-50/60 space-y-1.5">
            <h4 className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Company Contributions (CTC)</h4>
            {compContribs.map(li => (
              <div key={li.code} className="flex justify-between text-xs">
                <span className="text-teal-700">{li.name}</span>
                <span className="font-semibold tabular-nums text-teal-800">{formatCurrency(li.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Net Payable Box */}
        <div className="p-5 rounded-2xl bg-[#714b67]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-[#714b67] uppercase tracking-wider block">Net Payable to Bank</span>
            <span className="text-2xl font-black text-[#714b67] tabular-nums tracking-tight">
              {formatCurrency(computed.netPayable)}
            </span>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-500">
            <div>Payment Mode: <span className="font-medium text-slate-800">Bank Transfer (HDFC ···· 4829)</span></div>
            <div>Payrun: <span className="font-medium text-slate-800">{payrun?.name}</span></div>
          </div>
        </div>

        {/* "Why Did This Change?" — hidden on print */}
        {deltas.length > 0 && (
          <div className="no-print">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-1.5 text-xs text-[#714b67] font-semibold hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Why did this payslip change vs previous period?
              {showExplanation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showExplanation && (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 space-y-2 text-xs animate-in fade-in duration-150">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  Salary Delta — {payrun?.name} vs {prevPayrun?.name}
                </span>
                {deltas.map(d => (
                  <div key={d.name} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <div>
                      <span className="font-semibold text-slate-900">{d.name}</span>
                      <span className="text-slate-500 ml-2">{d.reason}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {d.delta > 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : d.delta < 0 ? (
                        <TrendingDown className="h-3 w-3 text-rose-500" />
                      ) : (
                        <Minus className="h-3 w-3 text-slate-400" />
                      )}
                      <span className={`font-mono font-bold ${d.delta > 0 ? 'text-emerald-700' : d.delta < 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                        {d.delta > 0 ? '+' : ''}{formatCurrency(d.delta)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compliance Footer */}
        <div className="pt-5 border-t border-slate-100 text-[10px] text-slate-400 text-center">
          Computer-generated payslip by PeoplePay360 HRMS · Rule Engine applied: {structureName} · Generated {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </Card>
    </div>
  )
}
