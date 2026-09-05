import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAttendance } from '../api/attendance'
import { getEmployees } from '../api/employees'
import AttendanceModal from '../components/AttendanceModal'
import { Clock, Plus, ShieldAlert, Filter, UserCheck } from 'lucide-react'

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
    return emp ? emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : `Employee #${empId}`
  }

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PRESENT':
        return 'bg-emerald-50 text-emerald-700'
      case 'LATE':
        return 'bg-amber-50 text-amber-700'
      case 'ABSENT':
        return 'bg-rose-50 text-rose-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#00A09D]" />
            <span>Attendance & Punch Records</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track daily check-ins, worked hours, and manual correction overrides
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#00A09D] hover:bg-[#008f8c] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer border-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log / Override Attendance</span>
        </button>
      </div>

      {/* Filter Banner */}
      {employeeFilterId && (
        <div className="p-4 rounded-xl bg-teal-50/60 text-xs text-[#00A09D] flex items-center justify-between shadow-xs border-0">
          <div className="flex items-center gap-2 font-medium">
            <Filter className="w-4 h-4" />
            <span>Filtering attendance for: <strong>{getEmpName(Number(employeeFilterId))}</strong></span>
          </div>
          <a href="/attendance" className="font-semibold underline hover:text-[#008f8c]">Clear Filter</a>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium animate-pulse">
            Loading attendance records...
          </div>
        ) : attendances.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No attendance entries recorded yet. Click &ldquo;Log / Override Attendance&rdquo; to add a punch record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Check-In Time</th>
                  <th className="px-6 py-3.5">Check-Out Time</th>
                  <th className="px-6 py-3.5">Worked Hours</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Audit / Exception</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {getEmpName(att.employee_id)}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {new Date(att.check_in).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {att.check_out ? new Date(att.check_out).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                      {att.worked_hours || 8.0} hrs
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusBadge(att.status)}`}>
                        {att.status || 'PRESENT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {att.is_manual_override ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Manual Override</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Standard Check-In</span>
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
