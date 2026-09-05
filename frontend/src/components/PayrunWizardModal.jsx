import { useState, useEffect } from 'react'
import { createPayrunWizard } from '../api/payruns'
import { getSalaryStructures } from '../api/salaryStructures'
import { getEmployees } from '../api/employees'
import { X, Search, CheckSquare, Square, ChevronRight, Check, Users } from 'lucide-react'

export default function PayrunWizardModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [structures, setStructures] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedEmpIds, setSelectedEmpIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: 'August 2025 Payrun',
    structure_id: '',
    period_start: '2025-08-01',
    period_end: '2025-08-31',
    department: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
      setStep(1)
      setError('')
    }
  }, [isOpen])

  const loadInitialData = async () => {
    try {
      const [structData, empData] = await Promise.all([
        getSalaryStructures(),
        getEmployees(),
      ])
      setStructures(structData || [])
      const empList = empData || []
      setEmployees(empList)
      setSelectedEmpIds(empList.map((e) => e.id))
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
    // Initialize selection with current filtered list if empty
    if (selectedEmpIds.length === 0) {
      setSelectedEmpIds(employees.map((e) => e.id))
    }
    setStep(2)
  }

  const toggleEmployee = (empId) => {
    setSelectedEmpIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    )
  }

  const handleSelectAll = (filteredList) => {
    const filteredIds = filteredList.map((e) => e.id)
    const allSelected = filteredIds.every((id) => selectedEmpIds.includes(id))
    if (allSelected) {
      setSelectedEmpIds((prev) => prev.filter((id) => !filteredIds.includes(id)))
    } else {
      setSelectedEmpIds((prev) => Array.from(new Set([...prev, ...filteredIds])))
    }
  }

  const handleSubmit = async () => {
    if (selectedEmpIds.length === 0) {
      setError('Please select at least one employee for the payrun batch.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: formData.name,
        structure_id: formData.structure_id ? Number(formData.structure_id) : null,
        period_start: formData.period_start,
        period_end: formData.period_end,
        employee_ids: selectedEmpIds,
      }
      const payrun = await createPayrunWizard(payload)
      onSuccess(payrun)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create payrun batch.')
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter((e) => {
    const matchesDept = !formData.department || e.department === formData.department
    const nameStr = `${e.full_name || ''} ${e.first_name || ''} ${e.last_name || ''} ${e.email || ''}`.toLowerCase()
    const matchesSearch = !searchQuery || nameStr.includes(searchQuery.toLowerCase())
    return matchesDept && matchesSearch
  })

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((e) => selectedEmpIds.includes(e.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#714b67]/10 text-[#714b67] flex items-center justify-center font-bold text-xs">
              {step}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create Payrun Wizard</h3>
              <p className="text-[11px] text-slate-400">Step {step} of 2 — {step === 1 ? 'Period & Structure' : 'Scope & Confirmation'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border-0">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payrun Batch Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
                  placeholder="e.g. August 2025 Payroll"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Salary Structure</label>
                <select
                  value={formData.structure_id}
                  onChange={(e) => setFormData({ ...formData, structure_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Period Start</label>
                  <input
                    type="date"
                    required
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Period End</label>
                  <input
                    type="date"
                    required
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 border-0 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#714b67] hover:bg-[#5e3e56] text-white text-xs font-semibold shadow-xs border-0 cursor-pointer">
                  <span>Continue to Scope</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Department Scope (Optional)</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
                >
                  <option value="">All Departments ({employees.length} employees)</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border-0 text-xs space-y-1.5">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Payrun Batch Summary</div>
                <div className="text-slate-800">Batch Name: <strong>{formData.name}</strong></div>
                <div className="text-slate-600">Period: <strong>{formData.period_start}</strong> to <strong>{formData.period_end}</strong></div>
                <div className="text-[#714b67] font-semibold">Eligible Active Employees: <strong>{filteredEmployees.length}</strong></div>
              </div>

              <div className="flex justify-between gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 border-0 cursor-pointer">
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading || selectedEmpIds.length === 0}
                  onClick={handleSubmit}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 border-0 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{loading ? 'Initializing...' : 'Initialize Payrun'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
