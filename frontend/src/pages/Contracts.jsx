import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getContracts, createContract } from '../api/contracts'
import { getEmployees } from '../api/employees'
import { getSalaryStructures } from '../api/salaryStructures'
import { FileText, Plus, Filter, Check, X, Building, DollarSign } from 'lucide-react'

export default function Contracts() {
  const [searchParams] = useSearchParams()
  const employeeFilterId = searchParams.get('employee_id')

  const [contracts, setContracts] = useState([])
  const [employees, setEmployees] = useState([])
  const [structures, setStructures] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    employee_id: employeeFilterId || 1,
    wage: 8500.0,
    date_start: '2025-01-01',
    date_end: '',
    department: 'Engineering',
    job_position: 'Senior Software Engineer',
    salary_structure_id: 1,
    is_active: true,
  })

  useEffect(() => {
    loadData()
  }, [employeeFilterId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cData, eData, sData] = await Promise.all([
        getContracts(employeeFilterId ? Number(employeeFilterId) : null),
        getEmployees(),
        getSalaryStructures(),
      ])
      setContracts(cData || [])
      setEmployees(eData || [])
      setStructures(sData || [])
    } catch (err) {
      console.error('Failed to load contracts data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createContract({
        employee_id: Number(formData.employee_id),
        wage: Number(formData.wage),
        date_start: formData.date_start,
        date_end: formData.date_end || null,
        department: formData.department,
        job_position: formData.job_position,
        salary_structure_id: formData.salary_structure_id ? Number(formData.salary_structure_id) : null,
        is_active: Boolean(formData.is_active),
      })
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create contract.')
    }
  }

  const getEmpName = (empId) => {
    const emp = employees.find((e) => e.id === empId)
    return emp ? emp.full_name || `${emp.first_name} ${emp.last_name}` : `Employee #${empId}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-400" />
            <span>Contracts Management (Module A2)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage period-aware employment contracts, base wages, and assigned salary structures
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract</span>
        </button>
      </div>

      {/* Filter Banner */}
      {employeeFilterId && (
        <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs text-brand-300 flex items-center justify-between">
          <span>Filtering contracts for Employee #{employeeFilterId}: <strong>{getEmpName(Number(employeeFilterId))}</strong></span>
          <a href="/contracts" className="underline font-bold text-white hover:text-brand-200">Clear Filter</a>
        </div>
      )}

      {/* Contracts Table */}
      <div className="overflow-hidden rounded-2xl glass-panel border border-slate-800 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department / Position</th>
              <th className="px-4 py-3">Base Wage</th>
              <th className="px-4 py-3">Period (Start → End)</th>
              <th className="px-4 py-3">Salary Structure</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {contracts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="px-4 py-3 font-bold text-white">{getEmpName(c.employee_id)}</td>
                <td className="px-4 py-3">
                  <div>{c.department || 'Engineering'}</div>
                  <div className="text-[10px] text-slate-400">{c.job_position || 'Staff'}</div>
                </td>
                <td className="px-4 py-3 font-extrabold text-emerald-400 text-sm">
                  ${c.wage?.toFixed(2)} / mo
                </td>
                <td className="px-4 py-3 font-mono">
                  {c.date_start} → {c.date_end || 'Ongoing'}
                </td>
                <td className="px-4 py-3 text-brand-300 font-semibold">
                  Regular Monthly Structure
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    c.is_active
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}>
                    {c.is_active ? 'ACTIVE' : 'EXPIRED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <h3 className="text-base font-bold text-white">Create Employment Contract</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Employee</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || emp.name || `Employee #${emp.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Base Wage ($ / Month)</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-bold text-emerald-400 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date Start</label>
                  <input
                    type="date"
                    required
                    value={formData.date_start}
                    onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date End (Optional)</label>
                  <input
                    type="date"
                    value={formData.date_end}
                    onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold">
                  <Check className="w-4 h-4" />
                  <span>Create Contract</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
