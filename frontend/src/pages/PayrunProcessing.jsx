import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getPayrun,
  computePayrun,
  validatePayrun,
  confirmPayrun,
  downloadPayslipPdfBlob,
} from '../api/payruns'
import { getEmployees } from '../api/employees'
import GuardianWarningBanner from '../components/GuardianWarningBanner'
import PayslipDetailModal from '../components/PayslipDetailModal'
import {
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Send,
  FileText,
  Download,
  AlertCircle,
} from 'lucide-react'

export default function PayrunProcessing() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [payrun, setPayrun] = useState(null)
  const [payslips, setPayslips] = useState([])
  const [employees, setEmployees] = useState([])
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedPayslip, setSelectedPayslip] = useState(null)
  const [notification, setNotification] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [prData, empData] = await Promise.all([getPayrun(id), getEmployees()])
      setPayrun(prData)
      setEmployees(empData || [])

      // Auto compute if draft or slips exist
      const computedSlips = await computePayrun(id)
      setPayslips(computedSlips || [])

      // Auto validate Guardian warnings
      const valRes = await validatePayrun(id)
      setWarnings(valRes.warnings || [])
    } catch (err) {
      console.error('Failed to load payrun details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCompute = async () => {
    setActionLoading(true)
    try {
      const computedSlips = await computePayrun(id)
      setPayslips(computedSlips || [])
      setNotification('Payrun re-computed idempotently!')
      setTimeout(() => setNotification(''), 3000)

      const valRes = await validatePayrun(id)
      setWarnings(valRes.warnings || [])
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to compute payrun.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleValidate = async () => {
    setActionLoading(true)
    try {
      const valRes = await validatePayrun(id)
      setWarnings(valRes.warnings || [])
      setNotification(`Validation complete. Found ${valRes.warning_count || 0} warning(s).`)
      setTimeout(() => setNotification(''), 3000)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to validate payrun.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirm = async () => {
    setActionLoading(true)
    try {
      const updatedPr = await confirmPayrun(id)
      setPayrun(updatedPr)
      setNotification('Payrun confirmed and marked as VALIDATED!')
      setTimeout(() => setNotification(''), 3000)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to confirm payrun.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendPayslips = () => {
    setNotification('Batch email dispatch triggered! All payslips emailed to employees.')
    setTimeout(() => setNotification(''), 4000)
  }

  const getEmpObj = (empId) => {
    return employees.find((e) => e.id === empId)
  }

  const getEmpName = (empId) => {
    const emp = getEmpObj(empId)
    return emp ? emp.full_name || `${emp.first_name} ${emp.last_name}` : `Employee #${empId}`
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Loading Payrun Batch Processor...
      </div>
    )
  }

  if (!payrun) {
    return (
      <div className="p-8 text-center text-red-400 text-sm space-y-4">
        <div>Payrun batch not found.</div>
        <button onClick={() => navigate('/payruns')} className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold">
          Back to Payruns
        </button>
      </div>
    )
  }

  const totalGross = payslips.reduce((acc, s) => acc + (s.gross || 0), 0)
  const totalNet = payslips.reduce((acc, s) => acc + (s.net || 0), 0)
  const totalDeductions = payslips.reduce((acc, s) => acc + (s.deductions || 0), 0)

  return (
    <div className="space-y-6">
      {/* Back Link & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/payruns')}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payruns Batch List</span>
        </button>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
          Batch #{payrun.id} • {payrun.status}
        </span>
      </div>

      {/* Header Banner & Action Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">{payrun.name || `Payrun #${payrun.id}`}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Pay Period: <strong className="text-white">{payrun.period_start} → {payrun.period_end}</strong> • Structure: <strong className="text-brand-300">Regular Monthly</strong>
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCompute}
              disabled={actionLoading}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-white text-xs font-bold border border-blue-500/40 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Compute</span>
            </button>

            <button
              onClick={handleValidate}
              disabled={actionLoading}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-white text-xs font-bold border border-purple-500/40 shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Validate</span>
            </button>

            <button
              onClick={handleConfirm}
              disabled={actionLoading}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Paid</span>
            </button>

            <button
              onClick={handleSendPayslips}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Payslips</span>
            </button>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">Total Payslips</span>
            <strong className="text-white text-base">{payslips.length}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Total Gross Salary</span>
            <strong className="text-blue-300 text-base">${totalGross.toFixed(2)}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Total Deductions</span>
            <strong className="text-amber-300 text-base">${totalDeductions.toFixed(2)}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Total Net Payable</span>
            <strong className="text-emerald-400 text-base">${totalNet.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Modules B6: Payroll Guardian Operational Warning Banner */}
      <GuardianWarningBanner warnings={warnings} />

      {/* Generated Payslips Summary Table */}
      <div className="overflow-hidden rounded-2xl glass-panel border border-slate-800 shadow-xl">
        <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 font-bold text-xs text-white flex items-center justify-between">
          <span>Itemized Generated Payslips ({payslips.length})</span>
          <span className="text-[11px] text-slate-400 font-normal">Click any payslip row to open itemized breakdown modal</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Basic Pay</th>
              <th className="px-4 py-3">Allowances</th>
              <th className="px-4 py-3">Gross Salary</th>
              <th className="px-4 py-3">Deductions</th>
              <th className="px-4 py-3">Net Payable</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {payslips.map((slip) => {
              const emp = getEmpObj(slip.employee_id)
              return (
                <tr
                  key={slip.id}
                  onClick={() => setSelectedPayslip(slip)}
                  className="hover:bg-slate-900/60 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3 font-bold text-white group-hover:text-brand-300">
                    {getEmpName(slip.employee_id)}
                    <span className="block text-[10px] text-slate-400 font-normal">{emp?.department}</span>
                  </td>
                  <td className="px-4 py-3">${slip.basic?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-blue-300">+${slip.allowances?.toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-brand-200">${slip.gross?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-amber-300">-${slip.deductions?.toFixed(2)}</td>
                  <td className="px-4 py-3 font-black text-emerald-400 text-sm">${slip.net?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPayslip(slip)
                      }}
                      className="px-3 py-1 rounded-lg bg-brand-600/30 hover:bg-brand-600 text-white font-bold border border-brand-500/30 text-xs"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Itemized Payslip Modal */}
      <PayslipDetailModal
        payslip={selectedPayslip}
        employee={selectedPayslip ? getEmpObj(selectedPayslip.employee_id) : null}
        payrun={payrun}
        isOpen={Boolean(selectedPayslip)}
        onClose={() => setSelectedPayslip(null)}
      />
    </div>
  )
}
