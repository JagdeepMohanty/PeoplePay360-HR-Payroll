import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getPayrun,
  computePayrun,
  validatePayrun,
  confirmPayrun,
  payPayrun,
  sendPayslipsEmail,
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
  AlertCircle,
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
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

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

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
      setNotification('Payrun re-computed successfully using active salary rules!')
      setTimeout(() => setNotification(''), 3500)

      const valRes = await validatePayrun(id)
      setWarnings(valRes.warnings || [])
      const updatedPr = await getPayrun(id)
      setPayrun(updatedPr)
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
      setNotification(`Validation complete. Detected ${valRes.warning_count || 0} compliance notice(s).`)
      setTimeout(() => setNotification(''), 3500)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to validate payrun.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkPaid = async () => {
    setActionLoading(true)
    try {
      const updatedPr = await payPayrun(id)
      setPayrun(updatedPr)
      setNotification('Payrun finalized and status updated to PAID!')
      setTimeout(() => setNotification(''), 3500)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to mark payrun as paid.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendPayslips = async () => {
    setActionLoading(true)
    try {
      const res = await sendPayslipsEmail(id)
      setNotification(res.message || `Dispatched payslip emails to ${res.sent_count || 0} employees.`)
      setTimeout(() => setNotification(''), 4500)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to dispatch payslip emails.')
    } finally {
      setActionLoading(false)
    }
  }

  const getEmpObj = (empId) => {
    return employees.find((e) => e.id === empId)
  }

  const getEmpName = (empId) => {
    const emp = getEmpObj(empId)
    return emp ? emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : `Employee #${empId}`
  }

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN')}`
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm font-medium animate-pulse">
        Loading Payrun Batch Processor & Computing Salary Engine Rules...
      </div>
    )
  }

  if (!payrun) {
    return (
      <div className="p-10 text-center space-y-4 bg-white rounded-2xl shadow-xs border-0">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-slate-800 font-semibold">Payrun batch not found.</div>
        <button
          onClick={() => navigate('/payruns')}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border-0"
        >
          Back to Payruns
        </button>
      </div>
    )
  }

  const totalGross = payslips.reduce((acc, s) => acc + (s.gross || 0), 0)
  const totalNet = payslips.reduce((acc, s) => acc + (s.net || 0), 0)
  const totalDeductions = payslips.reduce((acc, s) => acc + (s.deductions || 0), 0)

  // Filtered & Paginated list
  const filteredPayslips = payslips.filter((slip) => {
    const emp = getEmpObj(slip.employee_id)
    const name = getEmpName(slip.employee_id).toLowerCase()
    const dept = (emp?.department || '').toLowerCase()
    const q = searchQuery.toLowerCase()
    return name.includes(q) || dept.includes(q)
  })

  const totalPages = Math.ceil(filteredPayslips.length / pageSize) || 1
  const paginatedPayslips = filteredPayslips.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/payruns')}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payrun Batches</span>
        </button>

        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          payrun.status === 'PAID'
            ? 'bg-emerald-50 text-emerald-700'
            : payrun.status === 'VALIDATED'
            ? 'bg-purple-50 text-[#714b67]'
            : 'bg-amber-50 text-amber-700'
        }`}>
          Batch #{payrun.id} • {payrun.status}
        </span>
      </div>

      {/* Header Banner & Action Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border-0 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{payrun.name || `Payrun #${payrun.id}`}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Pay Period: <strong className="text-slate-700 font-semibold">{payrun.period_start} → {payrun.period_end}</strong> • Structure: <strong className="text-[#714b67] font-semibold">Regular Monthly</strong>
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCompute}
              disabled={actionLoading}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors cursor-pointer border-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Compute</span>
            </button>

            <button
              onClick={handleValidate}
              disabled={actionLoading}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#714b67] text-xs font-semibold transition-colors cursor-pointer border-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Validate</span>
            </button>

            <button
              onClick={handleMarkPaid}
              disabled={actionLoading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer border-0"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Mark Paid</span>
            </button>

            <button
              onClick={handleSendPayslips}
              disabled={actionLoading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#714b67] hover:bg-[#5e3d55] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer border-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Payslips</span>
            </button>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50/70">
            <span className="text-[11px] font-medium text-slate-400 block">Total Payslips</span>
            <strong className="text-slate-900 text-lg font-bold">{payslips.length}</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/70">
            <span className="text-[11px] font-medium text-slate-400 block">Total Gross Salary</span>
            <strong className="text-slate-900 text-lg font-bold">{formatCurrency(totalGross)}</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/70">
            <span className="text-[11px] font-medium text-slate-400 block">Total Deductions</span>
            <strong className="text-rose-600 text-lg font-bold">{formatCurrency(totalDeductions)}</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/60">
            <span className="text-[11px] font-medium text-emerald-700 block">Total Net Payable</span>
            <strong className="text-emerald-700 text-lg font-bold">{formatCurrency(totalNet)}</strong>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-purple-50 text-[#714b67] text-xs font-semibold flex items-center gap-2 shadow-xs border-0 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#714b67]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Modules B6: Payroll Guardian Operational Warning Banner */}
      <GuardianWarningBanner warnings={warnings} />

      {/* Generated Payslips Summary Table with Search & Pagination */}
      <div className="bg-white rounded-2xl shadow-xs border-0 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-xs text-slate-900 block">
              Itemized Generated Payslips ({filteredPayslips.length} of {payslips.length})
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              Showing page {currentPage} of {totalPages} • Click any row or button to view itemized breakdown
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search payslip..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-[#714b67] shadow-2xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Basic Pay</th>
                <th className="px-6 py-3.5">Allowances</th>
                <th className="px-6 py-3.5">Gross Salary</th>
                <th className="px-6 py-3.5">Deductions</th>
                <th className="px-6 py-3.5">Net Payable</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedPayslips.map((slip) => {
                const emp = getEmpObj(slip.employee_id)
                return (
                  <tr
                    key={slip.id}
                    onClick={() => setSelectedPayslip(slip)}
                    className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-[#714b67] transition-colors">
                      {getEmpName(slip.employee_id)}
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{emp?.department}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{formatCurrency(slip.basic)}</td>
                    <td className="px-6 py-4 font-medium text-[#00A09D]">+{formatCurrency(slip.allowances)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(slip.gross)}</td>
                    <td className="px-6 py-4 font-medium text-rose-600">-{formatCurrency(slip.deductions)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-700 text-sm">{formatCurrency(slip.net)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPayslip(slip)
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#714b67] hover:text-white text-slate-700 font-semibold text-xs transition-colors cursor-pointer border-0"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )
              })}

              {paginatedPayslips.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No payslips found matching &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 bg-slate-50/40 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredPayslips.length)} of {filteredPayslips.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
