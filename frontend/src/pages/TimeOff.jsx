import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
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
import { Calendar, Plus, CheckCircle2, PieChart, Filter } from 'lucide-react'

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
      setActionMessage('Leave request approved! Allocation balance deducted.')
      setTimeout(() => setActionMessage(''), 3500)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve leave request.')
    }
  }

  const handleRefuse = async (reqId) => {
    try {
      await refuseLeave(reqId)
      setActionMessage('Leave request refused.')
      setTimeout(() => setActionMessage(''), 3500)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to refuse leave request.')
    }
  }

  const getEmpName = (empId) => {
    const emp = employees.find((e) => e.id === empId)
    return emp ? emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : `Employee #${empId}`
  }

  const getTypeName = (typeId) => {
    const t = types.find((type) => type.id === typeId)
    return t ? t.name : `Type #${typeId}`
  }

  const canManage = ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'].includes(activeRole)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-500" />
            <span>Time Off & Leave Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Submit leave requests, monitor balances, and approve or refuse with live balance deduction
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer border-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Time Off Request</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs border-0 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter Banner */}
      {employeeFilterId && (
        <div className="p-4 rounded-xl bg-amber-50/60 text-xs text-amber-800 flex items-center justify-between shadow-xs border-0">
          <div className="flex items-center gap-2 font-medium">
            <Filter className="w-4 h-4" />
            <span>Filtering leaves for: <strong>{getEmpName(Number(employeeFilterId))}</strong></span>
          </div>
          <Link to="/time-off" className="font-semibold underline hover:text-amber-900">Clear Filter</Link>
        </div>
      )}

      {/* Leave Allocations Cards Summary */}
      <div>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-600" />
          <span>Current Leave Allocation Balances</span>
        </h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm font-medium animate-pulse">
            Loading allocations...
          </div>
        ) : allocations.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow-xs border-0 text-slate-400 text-xs text-center">
            No leave allocations configured for this scope.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {allocations.map((alloc) => {
              const remaining = alloc.remaining_days ?? (alloc.allocated_days - alloc.used_days)
              const pctUsed = alloc.allocated_days > 0 ? (alloc.used_days / alloc.allocated_days) * 100 : 0
              return (
                <div key={alloc.id} className="bg-white p-5 rounded-2xl shadow-xs border-0 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate max-w-[130px]">{getEmpName(alloc.employee_id)}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-[#714b67]">
                      {getTypeName(alloc.type_id)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-bold text-emerald-600">{remaining}d</span>
                    <span className="text-xs text-slate-400 font-medium">of {alloc.allocated_days}d allocated</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, pctUsed))}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-2xl shadow-xs border-0 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 font-semibold text-xs text-slate-700">
          Leave Requests & Approval Queue
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium animate-pulse">
            Loading leave requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No leave requests submitted yet. Click &ldquo;New Time Off Request&rdquo; to file one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Leave Type</th>
                  <th className="px-6 py-3.5">Dates (From → To)</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Payroll Impact</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {getEmpName(req.employee_id)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{getTypeName(req.type_id)}</td>
                    <td className="px-6 py-4 font-medium text-slate-500">{req.date_from} → {req.date_to}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{req.duration_days} day(s)</td>
                    <td className="px-6 py-4">
                      {req.is_unpaid ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                          Unpaid (LOP Deduction)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          Paid Leave
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : req.status === 'REFUSED'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {req.status === 'PENDING' && canManage ? (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer border-0"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRefuse(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs transition-colors cursor-pointer border-0"
                          >
                            Refuse
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
