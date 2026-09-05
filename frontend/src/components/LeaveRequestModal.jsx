import { useState } from 'react'
import { submitLeave } from '../api/leaves'
import { X, Calendar, Check } from 'lucide-react'

export default function LeaveRequestModal({ isOpen, onClose, onSuccess, employees = [], types = [] }) {
  const [formData, setFormData] = useState({
    employee_id: employees.length > 0 ? employees[0].id : 1,
    type_id: types.length > 0 ? types[0].id : 1,
    date_from: '2025-07-20',
    date_to: '2025-07-21',
    duration_days: 2.0,
    is_unpaid: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleTypeChange = (typeId) => {
    const selectedType = types.find((t) => t.id === Number(typeId))
    setFormData({
      ...formData,
      type_id: typeId,
      is_unpaid: selectedType ? selectedType.is_unpaid : false,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        employee_id: Number(formData.employee_id),
        type_id: Number(formData.type_id),
        date_from: formData.date_from,
        date_to: formData.date_to,
        duration_days: Number(formData.duration_days),
        is_unpaid: Boolean(formData.is_unpaid),
      }
      const res = await submitLeave(payload)
      onSuccess(res)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit leave request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">New Time Off Request</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Employee</label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name || emp.name || `Employee #${emp.id}`} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Leave Type</label>
            <select
              value={formData.type_id}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none"
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.unit}) {t.is_unpaid ? '— Unpaid (LOP)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date From</label>
              <input
                type="date"
                required
                value={formData.date_from}
                onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date To</label>
              <input
                type="date"
                required
                value={formData.date_to}
                onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Duration (Days)</label>
              <span className="text-[11px] text-slate-400">Total days deducted from allocation</span>
            </div>
            <input
              type="number"
              step="0.5"
              required
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
              className="w-20 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-bold text-center focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="is_unpaid"
              checked={formData.is_unpaid}
              onChange={(e) => setFormData({ ...formData, is_unpaid: e.target.checked })}
              className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
            />
            <label htmlFor="is_unpaid" className="text-xs font-medium text-amber-300 cursor-pointer">
              Mark as Unpaid Leave (Triggers LOP deduction in Payroll)
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
