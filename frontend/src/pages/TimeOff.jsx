import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getTimeOffTypes,
  getLeaveAllocations,
  getLeaveRequests,
  approveLeave,
  refuseLeave,
} from '../api/leaves'
import { getEmployees } from '../api/employees'
import { useAuth } from '../context/AuthContext'
import LeaveRequestModal from '../components/LeaveRequestModal'
import { Calendar, Plus, CheckCircle2, XCircle, Clock, AlertCircle, PieChart } from 'lucide-react'

export default function TimeOff() {
  const [searchParams] = useSearchParams()
  const employeeFilterId = searchParams.get('employee_id')
  const { activeRole } = useAuth()

  const [types, setTypes] = useState([])
  const [allocations, setAllocations] = useState([])
  const [requests, setRequests] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [employeeFilterId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tData, aData, rData, eData] = await Promise.all([
        getTimeOffTypes(),
        getLeaveAllocations(employeeFilterId ? Number(employeeFilterId) : null),
        getLeaveRequests(employeeFilterId ? Number(employeeFilterId) : null),
        getEmployees(),
      ])
      setTypes(tData || [])
      setAllocations(aData || [])
      setRequests(rData || [])
      setEmployees(eData || [])
    } catch (err) {
      console.error('Failed to load time off data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (reqId) => {
    try {
      await approveLeave(reqId)
      setActionMessage('Leave request approved! Allocation balance updated.')
      setTimeout(() => setActionMessage(''), 3000)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve leave request.')
    }
  }

  const handleRefuse = async (reqId) => {
    try {
      await refuseLeave(reqId)
      setActionMessage('Leave request refused.')
      setTimeout(() => setActionMessage(''), 3000)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to refuse leave request.')
    }
  }

  const getEmpName = (empId) => {
    const emp = employees.find((e) => e.id === empId)
    return emp ? emp.full_name || `${emp.first_name} ${emp.last_name}` : `Employee #${empId}`
  }

  const getTypeName = (typeId) => {
    const t = types.find((type) => type.id === typeId)
    return t ? t.name : `Type #${typeId}`
  }

  const canManage = ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'].includes(activeRole)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-amber-400" />
            <span>Time Off & Leave Workflow (Module B4)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit leave requests, manage allocations, and approve/refuse requests with live balance deduction
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Time Off Request</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Leave Allocations Cards Summary */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-400" />
          <span>Leave Allocation Balances</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {allocations.map((alloc) => {
            const remaining = alloc.remaining_days ?? (alloc.allocated_days - alloc.used_days)
            return (
              <div key={alloc.id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{getEmpName(alloc.employee_id)}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {getTypeName(alloc.type_id)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-2xl font-black text-emerald-400">{remaining}d</span>
                  <span className="text-xs text-slate-400">of {alloc.allocated_days}d allocated</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (alloc.used_days / alloc.allocated_days) * 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="overflow-hidden rounded-2xl glass-panel border border-slate-800 shadow-xl">
        <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 font-bold text-xs text-white">
          Leave Requests & Approval Queue
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Leave Type</th>
              <th className="px-4 py-3">Dates (From → To)</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Payroll Integration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Approval Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="px-4 py-3 font-bold text-white">{getEmpName(req.employee_id)}</td>
                <td className="px-4 py-3">{getTypeName(req.type_id)}</td>
                <td className="px-4 py-3 font-mono">{req.date_from} → {req.date_to}</td>
                <td className="px-4 py-3 font-bold text-amber-300">{req.duration_days} day(s)</td>
                <td className="px-4 py-3">
                  {req.is_unpaid ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                      Unpaid (LOP Deduction)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      Paid
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    req.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : req.status === 'REFUSED'
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-1.5">
                  {req.status === 'PENDING' && canManage ? (
                    <>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-white font-bold border border-emerald-500/30 text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRefuse(req.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-600/30 hover:bg-red-600 text-white font-bold border border-red-500/30 text-xs"
                      >
                        Refuse
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No action</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <LeaveRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false)
          loadData()
        }}
        employees={employees}
        types={types}
      />
    </div>
  )
}
