import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getAttendance,
  getAttendanceStatus,
  punchAttendance,
  deleteAttendance,
} from '../api/attendance'
import { getEmployees } from '../api/employees'
import AttendanceModal from '../components/AttendanceModal'
import {
  Clock,
  Plus,
  ShieldAlert,
  Filter,
  Search,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  LogIn,
  LogOut,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react'

export default function Attendance() {
  const [searchParams] = useSearchParams()
  const employeeFilterId = searchParams.get('employee_id')

  const { user, activeRole, token } = useAuth()
  const canManage = ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'].includes(activeRole)

  const [attendances, setAttendances] = useState([])
  const [employees, setEmployees] = useState([])
  const [todayStatus, setTodayStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [punchLoading, setPunchLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [apiError, setApiError] = useState(null)

  // Digital clock update every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Re-fetch data whenever role, token, or filter changes
  useEffect(() => {
    loadData()
  }, [employeeFilterId, token, activeRole])

  const loadData = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const [attData, empData, statusData] = await Promise.all([
        getAttendance(employeeFilterId ? Number(employeeFilterId) : null).catch((e) => {
          console.error('Failed to get attendance:', e)
          return []
        }),
        getEmployees().catch((e) => {
          console.error('Failed to get employees:', e)
          return []
        }),
        getAttendanceStatus(user?.employee_id || null).catch((e) => {
          console.error('Failed to get attendance status:', e)
          return null
        }),
      ])
      setAttendances(attData || [])
      setEmployees(empData || [])
      setTodayStatus(statusData || null)
    } catch (err) {
      console.error('Failed to load attendance logs:', err)
      setApiError(err.response?.data?.detail || err.message || 'Failed to load attendance logs')
    } finally {
      setLoading(false)
    }
  }

  // 1-Click Smart Punch Handler
  const handleSmartPunch = async () => {
    setPunchLoading(true)
    setApiError(null)
    try {
      await punchAttendance(user?.employee_id || null)
      await loadData()
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to punch attendance'
      setApiError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setPunchLoading(false)
    }
  }

  // Delete Record Handler (HR/Admin)
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this attendance record?')) return
    setApiError(null)
    try {
      await deleteAttendance(id)
      setAttendances((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to delete attendance record'
      setApiError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
  }

  const getEmpName = (empId, fallbackName) => {
    if (fallbackName) return fallbackName
    const emp = employees.find((e) => e.id === empId)
    return emp
      ? emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
      : `Employee #${empId}`
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

  // Filtered attendance list
  const filteredAttendances = useMemo(() => {
    return attendances.filter((att) => {
      const empName = getEmpName(att.employee_id, att.employee_name).toLowerCase()
      const matchesSearch = !searchQuery || empName.includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'OVERRIDE' && att.is_manual_override) ||
        att.status?.toUpperCase() === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [attendances, employees, searchQuery, statusFilter])

  // Aggregate summary metrics
  const totalPunches = attendances.length
  const presentCount = attendances.filter((a) => a.status === 'PRESENT').length
  const overrideCount = attendances.filter((a) => a.is_manual_override).length
  const totalHours = attendances
    .reduce((acc, curr) => acc + (Number(curr.worked_hours) || 0), 0)
    .toFixed(1)

  // Status check for live punch card
  const isCheckedIn = todayStatus && !todayStatus.check_out

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#00A09D]" />
            <span>Attendance & Punch Records</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track daily check-ins, worked hours, and manual correction overrides stored in PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh Attendance Data"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border-0 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#00A09D] hover:bg-[#008f8c] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer border-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log / Override Attendance</span>
          </button>
        </div>
      </div>

      {/* Robust Error State Alert Banner */}
      {apiError && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            className="text-rose-500 hover:text-rose-800 font-bold px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer border-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Smart 1-Click Kiosk Punch Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1a2e35] to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
            <Clock className="w-7 h-7 text-[#00E5DF]" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-[#00E5DF]" />
              <span>
                {currentTime.toLocaleDateString([], {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="opacity-40">•</span>
              <span className="font-mono text-white font-bold text-sm">
                {currentTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {user?.email ? user.email.split('@')[0] : 'Workforce Member'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00A09D]/30 text-[#00E5DF] uppercase tracking-wider">
                {activeRole}
              </span>
              {isCheckedIn ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Checked In since{' '}
                  {new Date(todayStatus.check_in).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              ) : todayStatus ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Shift Completed Today ({todayStatus.worked_hours || 0} hrs)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-slate-300">
                  Not Checked In Today
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {isCheckedIn ? (
            <button
              onClick={handleSmartPunch}
              disabled={punchLoading}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer border-0 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{punchLoading ? 'Punching Out...' : 'Punch Out (Check Out)'}</span>
            </button>
          ) : (
            <button
              onClick={handleSmartPunch}
              disabled={punchLoading}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00A09D] to-[#00b8b4] hover:from-[#00b8b4] hover:to-[#00A09D] text-white text-xs font-bold shadow-md transition-all cursor-pointer border-0 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{punchLoading ? 'Punching In...' : 'Quick Punch In (Check In)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border-0 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-50 text-[#00A09D]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Records</div>
            <div className="text-xl font-bold text-slate-900">{totalPunches}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border-0 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Present Check-Ins</div>
            <div className="text-xl font-bold text-slate-900">{presentCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border-0 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Hours Logged</div>
            <div className="text-xl font-bold text-slate-900">{totalHours}h</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border-0 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Manual Overrides</div>
            <div className="text-xl font-bold text-slate-900">{overrideCount}</div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border-0">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#00A09D]/20 border-0 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 text-xs font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-[#00A09D]/20 border-0 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
            <option value="OVERRIDE">Manual Overrides Only</option>
          </select>
        </div>
      </div>

      {/* Filter Banner */}
      {employeeFilterId && (
        <div className="p-4 rounded-xl bg-teal-50/60 text-xs text-[#00A09D] flex items-center justify-between shadow-xs border-0">
          <div className="flex items-center gap-2 font-medium">
            <Filter className="w-4 h-4" />
            <span>
              Filtering attendance for: <strong>{getEmpName(Number(employeeFilterId))}</strong>
            </span>
          </div>
          <a href="/attendance" className="font-semibold underline hover:text-[#008f8c]">
            Clear Filter
          </a>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium animate-pulse">
            Loading attendance records from database...
          </div>
        ) : filteredAttendances.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-3">
            <div>
              {searchQuery || statusFilter !== 'ALL'
                ? 'No attendance records match your search filter.'
                : 'No attendance entries recorded yet.'}
            </div>
            <button
              onClick={handleSmartPunch}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A09D] text-white text-xs font-semibold hover:bg-[#008f8c] transition-colors border-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Punch In Now</span>
            </button>
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
                  {canManage && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAttendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {getEmpName(att.employee_id, att.employee_name)}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {att.check_in
                        ? new Date(att.check_in).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {att.check_out ? (
                        new Date(att.check_out).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                      {att.worked_hours !== null && att.worked_hours !== undefined
                        ? `${att.worked_hours} hrs`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusBadge(
                          att.status
                        )}`}
                      >
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
                        <span className="text-[11px] text-slate-400 font-medium">
                          Standard Punch
                        </span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(att.id)}
                          title="Delete punch record"
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors border-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
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
