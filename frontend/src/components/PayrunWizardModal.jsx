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
    name: 'July 2025 Payrun',
    structure_id: '',
    period_start: '2025-07-01',
    period_end: '2025-07-31',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl glass-panel border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              {step}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">2-Step Payrun Creation Wizard</h3>
              <p className="text-xs text-slate-400">
                Step {step} of 2 &mdash; {step === 1 ? 'Define Structure & Period Scope' : 'Filter & Select Employees (DRAFT Batch)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
                  <span>Continue to Employee Selection</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Filter by Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Search Employee</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Selection Bar */}
              <div className="flex items-center justify-between px-2 pt-1 text-xs">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(filteredEmployees)}
                    className="flex items-center space-x-1 text-brand-400 hover:text-brand-300 font-semibold"
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-brand-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                    <span>{allFilteredSelected ? 'Deselect Visible' : 'Select Visible'}</span>
                  </button>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-slate-400">{filteredEmployees.length} matching</span>
                </div>
                <div className="text-brand-300 font-semibold">
                  {selectedEmpIds.length} employee{selectedEmpIds.length !== 1 ? 's' : ''} selected
                </div>
              </div>

              {/* Scrollable Employee List */}
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-800/60 bg-slate-900/40">
                {filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No employees found matching filter criteria.
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = selectedEmpIds.includes(emp.id)
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleEmployee(emp.id)}
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-brand-600/10' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent div
                            className="rounded border-slate-700 text-brand-600 focus:ring-brand-500 pointer-events-none"
                          />
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{emp.full_name || `${emp.first_name} ${emp.last_name}`}</span>
                              <span className="text-[10px] text-slate-400 font-normal">#{emp.id}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">{emp.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {emp.department || 'General'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Summary */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Payrun Batch Preview</div>
                <div className="text-white">Batch: <strong>{formData.name}</strong></div>
                <div className="text-slate-300">Period: <strong>{formData.period_start}</strong> to <strong>{formData.period_end}</strong></div>
                <div className="text-emerald-400">Selected for DRAFT Batch: <strong>{selectedEmpIds.length}</strong> employee(s)</div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading || selectedEmpIds.length === 0}
                  onClick={handleSubmit}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Creating Batch...' : 'Create Batch (DRAFT)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
