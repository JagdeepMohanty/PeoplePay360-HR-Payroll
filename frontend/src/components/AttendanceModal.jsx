import { useState, useEffect } from 'react'
import { logAttendance } from '../api/attendance'
import { useAuth } from '../context/AuthContext'
import { X, Clock, Check } from 'lucide-react'

// Helper to format date into local datetime-local string (YYYY-MM-DDTHH:mm)
const getLocalDatetimeLocal = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AttendanceModal({ isOpen, onClose, onSuccess, employees = [], defaultEmployeeId = null }) {
  const { user, activeRole } = useAuth()
  const isEmployeeRole = activeRole === 'EMPLOYEE' && !!user?.employee_id

  const getInitialEmpId = () => {
    if (isEmployeeRole) return user.employee_id
    if (defaultEmployeeId) return defaultEmployeeId
    if (employees.length > 0) return employees[0].id
    return ''
  }

  const [formData, setFormData] = useState({
    employee_id: getInitialEmpId(),
    check_in: getLocalDatetimeLocal(),
    check_out: '',
    worked_hours: 8.0,
    status: 'PRESENT',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      const initialId = isEmployeeRole
        ? user.employee_id
        : defaultEmployeeId || (employees.length > 0 ? employees[0].id : '')

      setFormData({
        employee_id: initialId,
        check_in: getLocalDatetimeLocal(),
        check_out: '',
        worked_hours: 8.0,
        status: 'PRESENT',
      })
      setError('')
    }
  }, [isOpen, employees, defaultEmployeeId, isEmployeeRole, user])

  if (!isOpen) return null

  const handleCheckOutChange = (val) => {
    let hours = formData.worked_hours
    if (formData.check_in && val) {
      const d1 = new Date(formData.check_in)
      const d2 = new Date(val)
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 > d1) {
        hours = Math.round(((d2.getTime() - d1.getTime()) / (1000 * 60 * 60)) * 10) / 10
      }
    }
    setFormData((prev) => ({ ...prev, check_out: val, worked_hours: hours }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const empId = Number(formData.employee_id)
    if (!empId || isNaN(empId)) {
      setError('Please select a valid employee.')
      return
    }

    if (!formData.check_in) {
      setError('Please provide a valid check-in time.')
      return
    }

    const checkInDate = new Date(formData.check_in)
    if (isNaN(checkInDate.getTime())) {
      setError('Invalid check-in time format.')
      return
    }

    let checkOutISO = null
    if (formData.check_out) {
      const checkOutDate = new Date(formData.check_out)
      if (isNaN(checkOutDate.getTime())) {
        setError('Invalid check-out time format.')
        return
      }
      checkOutISO = checkOutDate.toISOString()
    }

    setLoading(true)
    try {
      const payload = {
        employee_id: empId,
        check_in: checkInDate.toISOString(),
        check_out: checkOutISO,
        worked_hours: Number(formData.worked_hours) || 8.0,
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
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-0 cursor-pointer"
          >
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
              {employees.length === 0 && isEmployeeRole && user ? (
                <option value={user.employee_id}>
                  {user.name || user.email} (Self)
                </option>
              ) : (
                employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee #${emp.id}`} ({emp.department || 'Staff'})
                  </option>
                ))
              )}
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
                onChange={(e) => handleCheckOutChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Worked Hours</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 border-0 cursor-pointer"
            >
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
