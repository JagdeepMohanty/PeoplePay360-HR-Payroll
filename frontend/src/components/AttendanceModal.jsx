import { useState, useEffect } from 'react'
import { logAttendance } from '../api/attendance'
import { useAuth } from '../context/AuthContext'
import { X, Clock, Check } from 'lucide-react'

export default function AttendanceModal({ isOpen, onClose, onSuccess, employees = [] }) {
  const { user, activeRole } = useAuth()
  const isEmployeeRole = activeRole === 'EMPLOYEE' && !!user?.employee_id

  const getInitialEmpId = () => {
    if (isEmployeeRole) return user.employee_id
    if (employees.length > 0) return employees[0].id
    return ''
  }

  const [formData, setFormData] = useState({
    employee_id: getInitialEmpId(),
    check_in: new Date().toISOString().slice(0, 16),
    check_out: '',
    worked_hours: 8.0,
    status: 'PRESENT',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      const selectedId = isEmployeeRole
        ? user.employee_id
        : (employees.length > 0 ? employees[0].id : '')

      setFormData({
        employee_id: selectedId,
        check_in: new Date().toISOString().slice(0, 16),
        check_out: '',
        worked_hours: 8.0,
        status: 'PRESENT',
      })
      setError('')
    }
  }, [isOpen, employees, activeRole, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        employee_id: Number(formData.employee_id),
        check_in: new Date(formData.check_in).toISOString(),
        check_out: formData.check_out ? new Date(formData.check_out).toISOString() : null,
        worked_hours: Number(formData.worked_hours),
        status: formData.status,
      }
      const res = await logAttendance(payload)
      onSuccess(res)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to log attendance record.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Log / Correct Attendance</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border-0">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Employee {isEmployeeRole && <span className="text-[10px] text-amber-600 font-normal">(Locked to Self)</span>}
            </label>
            <select
              value={formData.employee_id}
              disabled={isEmployeeRole}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee #${emp.id}`} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Check In</label>
              <input
                type="datetime-local"
                required
                value={formData.check_in}
                onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Check Out</label>
              <input
                type="datetime-local"
                value={formData.check_out}
                onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Worked Hours</label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.worked_hours}
                onChange={(e) => setFormData({ ...formData, worked_hours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
              >
                <option value="PRESENT">PRESENT</option>
                <option value="LATE">LATE</option>
                <option value="ABSENT">ABSENT</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 border-0 cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#714b67] hover:bg-[#5e3e56] text-white text-xs font-semibold shadow-xs disabled:opacity-50 border-0 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Save Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
