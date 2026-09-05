import { useState, useEffect } from 'react'
import { logAttendance } from '../api/attendance'
import { useAuth } from '../context/AuthContext'
import { X, Clock, Check, AlertCircle } from 'lucide-react'

// Helper to format date into local datetime-local string (YYYY-MM-DDTHH:mm)
const getLocalDatetimeLocal = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Safely format API error detail into a display string
const formatErrorDetail = (err, fallback = 'Failed to log attendance record.') => {
  if (!err) return fallback
  const detail = err.response?.data?.detail
  if (!detail) return err.message || fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || (typeof d === 'string' ? d : JSON.stringify(d))).join(', ')
  }
  if (typeof detail === 'object') {
    return detail.message || JSON.stringify(detail)
  }
  return String(detail)
}

export default function AttendanceModal({ isOpen, onClose, onSuccess, employees = [], defaultEmployeeId = null }) {
  const { user, activeRole } = useAuth()
  const isEmployeeRole = activeRole === 'EMPLOYEE'

  const getInitialEmpId = () => {
    if (isEmployeeRole && user?.employee_id) return user.employee_id
    if (defaultEmployeeId) return defaultEmployeeId
    if (employees.length > 0) return employees[0].id
    return user?.employee_id || 4
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const initialId = isEmployeeRole && user?.employee_id
        ? user.employee_id
        : defaultEmployeeId || (employees.length > 0 ? employees[0].id : (user?.employee_id || 4))

      setFormData({
        employee_id: initialId,
        check_in: getLocalDatetimeLocal(),
        check_out: '',
        worked_hours: 8.0,
        status: 'PRESENT',
      })
      setError('')
      setLoading(false)
    }
  }, [isOpen, employees, defaultEmployeeId, isEmployeeRole, user])

  if (!isOpen) return null

  const handleClose = () => {
    setError('')
    setLoading(false)
    if (typeof onClose === 'function') {
      onClose()
    }
  }

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
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }
    setError('')

    const rawEmpId = formData.employee_id || (user?.employee_id) || (employees[0]?.id) || 4
    const empId = Number(rawEmpId)

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
    if (formData.check_out && formData.check_out.trim() !== '') {
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
        status: formData.status || 'PRESENT',
      }
      const res = await logAttendance(payload)
      if (typeof onSuccess === 'function') {
        onSuccess(res)
      } else {
        handleClose()
      }
    } catch (err) {
      setError(formatErrorDetail(err, 'Failed to log attendance record.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Log / Correct Attendance</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            title="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border-0 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
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
                <option value={user.employee_id || 4}>
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 border-0 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#714b67] hover:bg-[#5e3e56] text-white text-xs font-semibold shadow-xs disabled:opacity-50 border-0 cursor-pointer transition-colors"
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
