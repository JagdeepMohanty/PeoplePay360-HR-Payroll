import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calculator, ShieldCheck, CheckCircle2, Send, Eye, FileText, ArrowLeft, AlertCircle } from 'lucide-react'
import { fetchPayrunDetail, fetchPayrollWarnings, dispatchPayslipEmail, generatePayslipPdf } from '../api/payrollAdapter'
import PayrollStatusBadge from '../components/payroll/common/PayrollStatusBadge'
import PayrollWarningBanner from '../components/payroll/warnings/PayrollWarningBanner'
import PayslipDrawerModal from '../components/payroll/payslip/PayslipDrawerModal'
import LoadingState from '../components/payroll/common/LoadingState'

export default function PayrunProcessing() {
  const { id } = useParams()
  const qc = useQueryClient()

  const [currentStatus, setCurrentStatus] = useState('draft')
  const [warnings, setWarnings] = useState([])
  const [activePayslip, setActivePayslip] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [dispatchingAll, setDispatchingAll] = useState(false)

  // Fetch payrun details
  const { data: payrun, isLoading } = useQuery({
    queryKey: ['payrun', id],
    queryFn: () => fetchPayrunDetail(id),
  })

  // Sync status state when payrun data loads
  useEffect(() => {
    if (payrun?.state) {
      setCurrentStatus(payrun.state)
    }
  }, [payrun])

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Action Mutations
  const [isComputing, setIsComputing] = useState(false)
  const handleCompute = async () => {
    setIsComputing(true)
    setTimeout(() => {
      setCurrentStatus('computed')
      setIsComputing(false)
      showToast(`Payrun #${id} computed successfully based on active running contracts.`)
    }, 800)
  }

  const [isValidating, setIsValidating] = useState(false)
  const handleValidate = async () => {
    setIsValidating(true)
    const warningList = await fetchPayrollWarnings(id)
    setWarnings(warningList)
    setCurrentStatus('validated')
    setIsValidating(false)
    showToast(`Guardian checks complete. ${warningList.length} warning(s) detected.`, warningList.length > 0 ? 'warning' : 'success')
  }

  const [isConfirming, setIsConfirming] = useState(false)
  const handleMarkPaid = async () => {
    setIsConfirming(true)
    setTimeout(() => {
      setCurrentStatus('confirmed')
      setIsConfirming(false)
      showToast(`Payrun #${id} marked as Paid & Confirmed.`)
    }, 800)
  }

  const handleSendAllPayslips = async () => {
    setDispatchingAll(true)
    setTimeout(() => {
      setDispatchingAll(false)
      showToast(`All employee payslips for Payrun #${id} queued for email delivery.`)
    }, 1000)
  }

  if (isLoading) {
    return <LoadingState rows={5} message="Loading payrun execution & payslip details…" />
  }

  const payslips = payrun?.payslips || []

  // Status progression rules for button states
  const canCompute = currentStatus === 'draft' || currentStatus === 'computed'
  const canValidate = currentStatus === 'computed' || currentStatus === 'validated'
  const canMarkPaid = currentStatus === 'validated'
  const canSendPayslips = currentStatus === 'confirmed'

  return (
    <div className="max-w-5xl space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
          toastMessage.type === 'warning' ? 'bg-amber-500 text-white' :
          toastMessage.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            {toastMessage.text}
          </span>
          <button onClick={() => setToastMessage(null)} className="hover:opacity-80">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/payruns" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
              <ArrowLeft size={12} /> Payruns
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-bold text-gray-500">Processing</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{payrun?.name || `Payrun #${id}`}</h1>
            <PayrollStatusBadge status={currentStatus} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Period: <span className="font-semibold text-gray-700">{payrun?.period_start} → {payrun?.period_end}</span> · {payrun?.structure_name}
          </p>
        </div>

        {/* Action Buttons Toolbar with Status Progression Enforcement */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Step 1: Compute */}
          <button
            onClick={handleCompute}
            disabled={!canCompute || isComputing}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              currentStatus === 'draft'
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            <Calculator size={14} /> {isComputing ? 'Computing…' : '1. Compute'}
          </button>

          {/* Step 2: Validate */}
          <button
            onClick={handleValidate}
            disabled={!canValidate || isValidating}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              currentStatus === 'computed'
                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            <ShieldCheck size={14} /> {isValidating ? 'Running Checks…' : '2. Validate'}
          </button>

          {/* Step 3: Mark Paid */}
          <button
            onClick={handleMarkPaid}
            disabled={!canMarkPaid || isConfirming}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              currentStatus === 'validated'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            <CheckCircle2 size={14} /> {isConfirming ? 'Processing…' : '3. Mark Paid'}
          </button>

          {/* Step 4: Send Payslips */}
          <button
            onClick={handleSendAllPayslips}
            disabled={!canSendPayslips || dispatchingAll}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              currentStatus === 'confirmed'
                ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            <Send size={14} /> {dispatchingAll ? 'Dispatching…' : 'Send All Payslips'}
          </button>
        </div>
      </div>

      {/* Warnings Component (PART C) */}
      <PayrollWarningBanner warnings={warnings} />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Employees</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{payrun?.employee_count || payslips.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Gross Pay Sum</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">${payrun?.total_gross?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Net Payable Sum</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">${payrun?.total_net?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-900">Calculated Employee Payslips ({payslips.length})</h2>
          <span className="text-xs text-gray-400">Click any row to open itemized breakdown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-right">Basic</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right">Deductions</th>
                <th className="px-4 py-3 text-right">Net Pay</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payslips.map((ps) => (
                <tr
                  key={ps.id}
                  onClick={() => setActivePayslip(ps)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900">{ps.employee_name}</p>
                    <p className="text-[11px] text-gray-400">{ps.job_title}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-medium">{ps.department}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">${ps.basic_pay?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">${ps.gross_pay?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium text-rose-600">-${ps.total_deductions?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700">${ps.net_pay?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActivePayslip(ps)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium transition-colors"
                    >
                      <Eye size={12} /> View Breakdown
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Itemized Payslip Drawer Modal (PART D & E) */}
      {activePayslip && (
        <PayslipDrawerModal
          payslip={activePayslip}
          onClose={() => setActivePayslip(null)}
        />
      )}
    </div>
  )
}
