import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Search, CheckSquare, Square, Users, Calendar, ArrowRight, ArrowLeft } from 'lucide-react'
import { fetchSalaryStructures, fetchEligibleEmployees, createPayrunWizard } from '../../../api/payrollAdapter'
import LoadingState from '../common/LoadingState'

const INITIAL_FORM = {
  period_start: '',
  period_end: '',
  structure_id: '1',
  department: '',
}

export default function PayrunWizardModal({ onClose }) {
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Wizard state
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL_FORM)

  // Step 2 filter state
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedEmpIds, setSelectedEmpIds] = useState([])

  // Fetch salary structures for Step 1
  const { data: structures = [] } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: fetchSalaryStructures,
  })

  // Fetch eligible employees for Step 2
  const { data: eligibleEmployees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['eligibleEmployees', deptFilter || form.department, search, typeFilter],
    queryFn: () => fetchEligibleEmployees({
      department: deptFilter || form.department,
      search,
      employeeType: typeFilter,
    }),
    enabled: step === 2,
  })

  // Pre-select all eligible employees when step 2 loads
  useEffect(() => {
    if (step === 2 && eligibleEmployees.length > 0 && selectedEmpIds.length === 0) {
      setSelectedEmpIds(eligibleEmployees.map(e => e.id))
    }
  }, [step, eligibleEmployees])

  // Create Payrun mutation
  const { mutate: handleCreatePayrun, isPending: isCreating } = useMutation({
    mutationFn: createPayrunWizard,
    onSuccess: (newPayrun) => {
      qc.invalidateQueries(['payruns'])
      onClose()
      navigate(`/payruns/${newPayrun.id}/process`)
    },
  })

  const handleNextStep = (e) => {
    e.preventDefault()
    if (!form.period_start || !form.period_end) {
      alert('Please specify both period start and period end dates.')
      return
    }
    setStep(2)
  }

  const toggleSelectAll = () => {
    if (selectedEmpIds.length === eligibleEmployees.length) {
      setSelectedEmpIds([])
    } else {
      setSelectedEmpIds(eligibleEmployees.map(e => e.id))
    }
  }

  const toggleSelectEmployee = (id) => {
    setSelectedEmpIds(prev =>
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
    )
  }

  const handleSubmitPayrun = () => {
    if (selectedEmpIds.length === 0) {
      alert('Please select at least one eligible employee to include in this payrun.')
      return
    }

    const payload = {
      ...form,
      employee_ids: selectedEmpIds,
    }
    handleCreatePayrun(payload)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold">2-Step Payrun Creation Wizard</h2>
            <p className="text-xs text-gray-400">Step {step} of 2 — {step === 1 ? 'Period & Scope Selection' : 'Employee Eligibility Selection'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-2 text-center text-xs font-semibold border-b border-gray-200 bg-gray-50">
          <div className={`py-2.5 border-r border-gray-200 ${step === 1 ? 'bg-blue-50 text-blue-700 border-b-2 border-b-blue-600' : 'text-gray-500'}`}>
            1. Period & Structure Setup
          </div>
          <div className={`py-2.5 ${step === 2 ? 'bg-blue-50 text-blue-700 border-b-2 border-b-blue-600' : 'text-gray-500'}`}>
            2. Employee Selection ({selectedEmpIds.length})
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Period Start Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={form.period_start}
                      onChange={(e) => setForm(f => ({ ...f, period_start: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Period End Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={form.period_end}
                      onChange={(e) => setForm(f => ({ ...f, period_end: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Salary Structure *
                </label>
                <select
                  value={form.structure_id}
                  onChange={(e) => setForm(f => ({ ...f, structure_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {structures.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — {s.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Department Scope (Optional)
                </label>
                <select
                  value={form.department}
                  onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Departments (Company-wide)</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Leave blank to auto-include all eligible employees across every department.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Continue to Employee Selection <ArrowRight size={14} />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Step 2 Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search name or title…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:outline-none"
                  />
                </div>

                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none"
                >
                  <option value="">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none"
                >
                  <option value="">All Employment Types</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Contractor">Contractor</option>
                </select>
              </div>

              {/* Employee Selection List Header */}
              <div className="flex justify-between items-center text-xs font-semibold text-gray-700 pt-1">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800"
                >
                  {selectedEmpIds.length === eligibleEmployees.length && eligibleEmployees.length > 0 ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                  Select All ({eligibleEmployees.length})
                </button>

                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
                  Selected: {selectedEmpIds.length} / {eligibleEmployees.length}
                </span>
              </div>

              {/* Employee Table */}
              {loadingEmployees ? (
                <LoadingState rows={4} message="Fetching eligible employees with active contracts…" />
              ) : eligibleEmployees.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8 border border-dashed rounded-lg">
                  No eligible employees found for the selected department or filter criteria.
                </p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-gray-100 text-xs">
                  {eligibleEmployees.map(emp => {
                    const isSelected = selectedEmpIds.includes(emp.id)
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleSelectEmployee(emp.id)}
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <CheckSquare size={16} className="text-blue-600 shrink-0" />
                          ) : (
                            <Square size={16} className="text-gray-300 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{emp.name}</p>
                            <p className="text-[11px] text-gray-500">{emp.job_title} · {emp.department}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                            {emp.type}
                          </span>
                          {!emp.bank_account && (
                            <p className="text-[10px] text-amber-600 mt-0.5">⚠ No Bank Details</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Step 2 Action Buttons */}
              <div className="pt-4 flex justify-between items-center border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
                >
                  <ArrowLeft size={14} /> Back to Step 1
                </button>

                <button
                  type="button"
                  onClick={handleSubmitPayrun}
                  disabled={isCreating || selectedEmpIds.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isCreating ? 'Creating Payrun…' : `Create Payrun (${selectedEmpIds.length} Employees)`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
