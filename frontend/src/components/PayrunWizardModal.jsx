import { useState, useEffect } from 'react'
import { createPayrunWizard } from '../api/payruns'
import { getSalaryStructures } from '../api/salaryStructures'
import { getEmployees } from '../api/employees'
import { X, Calendar, Layers, Users, ChevronRight, Check } from 'lucide-react'

export default function PayrunWizardModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [structures, setStructures] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: 'July 2025 Payrun',
    structure_id: '',
    period_start: '2025-07-01',
    period_end: '2025-07-31',
    department: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  const loadInitialData = async () => {
    try {
      const [structData, empData] = await Promise.all([
        getSalaryStructures(),
        getEmployees(),
      ])
      setStructures(structData || [])
      setEmployees(empData || [])
      if (structData && structData.length > 0) {
        setFormData((prev) => ({ ...prev, structure_id: structData[0].id }))
      }
    } catch (err) {
      console.error('Failed to load wizard setup data:', err)
    }
  }

  if (!isOpen) return null

  const handleNext = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.period_start || !formData.period_end) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setStep(2)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: formData.name,
        structure_id: formData.structure_id ? Number(formData.structure_id) : null,
        period_start: formData.period_start,
        period_end: formData.period_end,
      }
      const payrun = await createPayrunWizard(payload)
      onSuccess(payrun)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create payrun batch.')
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = formData.department
    ? employees.filter((e) => e.department === formData.department)
    : employees

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              {step}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Payrun Wizard</h3>
              <p className="text-xs text-slate-400">Step {step} of 2 — {step === 1 ? 'Period & Structure' : 'Scope & Confirmation'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payrun Batch Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                  placeholder="e.g. July 2025 Payroll"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Salary Structure</label>
                <select
                  value={formData.structure_id}
                  onChange={(e) => setFormData({ ...formData, structure_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                >
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.rules?.length || 7} rules)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Period Start</label>
                  <input
                    type="date"
                    required
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Period End</label>
                  <input
                    type="date"
                    required
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20">
                  <span>Continue to Scope</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Filter by Department Scope (Optional)</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="">All Departments ({employees.length} employees)</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400 font-semibold uppercase tracking-wider">Payrun Summary</div>
                <div className="text-white">Batch: <strong>{formData.name}</strong></div>
                <div className="text-slate-300">Period: <strong>{formData.period_start}</strong> to <strong>{formData.period_end}</strong></div>
                <div className="text-brand-300">Eligible Employees: <strong>{filteredEmployees.length}</strong></div>
              </div>

              <div className="flex justify-between space-x-2 pt-4">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800">
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Initializing Payrun...' : 'Initialize & Compute Payrun'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
