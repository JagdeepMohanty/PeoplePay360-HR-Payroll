import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAttendance } from '../api/attendance'
import { getEmployees } from '../api/employees'
import AttendanceModal from '../components/AttendanceModal'
import { Clock, Plus, ShieldAlert, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

export default function Attendance() {
  const [searchParams] = useSearchParams()
  const employeeFilterId = searchParams.get('employee_id')

  const [attendances, setAttendances] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [employeeFilterId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [attData, empData] = await Promise.all([
        getAttendance(employeeFilterId ? Number(employeeFilterId) : null),
        getEmployees(),
      ])
      setAttendances(attData || [])
      setEmployees(empData || [])
    } catch (err) {
      console.error('Failed to load attendance logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const getEmpName = (empId) => {
    const emp = employees.find((e) => e.id === empId)
    return emp ? emp.full_name || `${emp.first_name} ${emp.last_name}` : `Employee #${empId}`
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'LATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      case 'ABSENT':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Clock className="w-7 h-7 text-purple-400" />
            <span>Attendance & Exception Handling (Phase 1)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor check-ins, check-outs, worked hours, and manual correction overrides
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Log / Correct Attendance</span>
        </button>
      </div>

      {/* Filter Banner */}
      {employeeFilterId && (
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 flex items-center justify-between">
          <span>Filtering attendance records for Employee #{employeeFilterId}: <strong>{getEmpName(Number(employeeFilterId))}</strong></span>
          <a href="/attendance" className="underline font-bold text-white hover:text-purple-200">Clear Filter</a>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl glass-panel border border-slate-800 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Check In Time</th>
              <th className="px-4 py-3">Check Out Time</th>
              <th className="px-4 py-3">Worked Hours</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Audit / Exception</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {attendances.map((att) => (
              <tr key={att.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="px-4 py-3 font-bold text-white">{getEmpName(att.employee_id)}</td>
                <td className="px-4 py-3 font-mono text-slate-300">
                  {new Date(att.check_in).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">
                  {att.check_out ? new Date(att.check_out).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 font-bold text-purple-300 text-sm">
                  {att.worked_hours || 8.0} hrs
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(att.status)}`}>
                    {att.status || 'PRESENT'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {att.is_manual_override ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                      <span>MANUAL OVERRIDE</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Standard Biometric Log</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false)
          loadData()
        }}
        employees={employees}
      />
    </div>
  )
}
