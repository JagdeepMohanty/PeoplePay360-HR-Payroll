import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getContracts, createContract } from '../api/contracts'
import { getEmployees } from '../api/employees'
import { getSalaryStructures } from '../api/salaryStructures'
import { FileText, Plus, X, Check, Building, Briefcase, Calendar, Filter } from 'lucide-react'

export default function Contracts() {
  const [searchParams] = useSearchParams()
  const employeeFilterId = searchParams.get('employee_id')

  const [contracts, setContracts] = useState([])
  const [employees, setEmployees] = useState([])
  const [structures, setStructures] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    employee_id: employeeFilterId || '',
    wage: 85000.0,
    date_start: new Date().toISOString().split('T')[0],
    date_end: '',
    department: 'Engineering',
    job_position: 'Senior Software Engineer',
    salary_structure_id: '',
    is_active: true,
  })

  useEffect(() => {
    loadData()
  }, [employeeFilterId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cData, eData, sData] = await Promise.all([
        getContracts(employeeFilterId ? Number(employeeFilterId) : null).catch(() => []),
        getEmployees().catch(() => []),
        getSalaryStructures().catch(() => []),
      ])
      setContracts(cData || [])
      setEmployees(eData || [])
      setStructures(sData || [])

      if (eData && eData.length > 0 && !formData.employee_id) {
        setFormData(prev => ({
          ...prev,
          employee_id: employeeFilterId || eData[0].id,
          salary_structure_id: sData && sData.length > 0 ? sData[0].id : ''
        }))
      }
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
    return emp ? emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : `Employee #${empId}`
  }

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#714b67]" />
            <span>Contracts Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Period-aware employment contracts, base wages, and assigned salary structures
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#714b67] hover:bg-[#5e3d55] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer border-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract</span>
        </button>
      </div>

      {/* Filter Banner */}
      {employeeFilterId && (
        <div className="p-4 rounded-xl bg-purple-50/60 text-xs text-[#714b67] flex items-center justify-between shadow-xs border-0">
          <div className="flex items-center gap-2 font-medium">
            <Filter className="w-4 h-4" />
            <span>Filtering contracts for: <strong>{getEmpName(Number(employeeFilterId))}</strong></span>
          </div>
          <a href="/contracts" className="font-semibold underline hover:text-[#5e3d55]">Clear Filter</a>
        </div>
      )}

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl shadow-xs border-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium animate-pulse">
            Loading active contracts...
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No contract records found. Click &ldquo;New Contract&rdquo; to establish an employment agreement.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Department & Position</th>
                  <th className="px-6 py-3.5">Base Monthly Wage</th>
                  <th className="px-6 py-3.5">Period (Start → End)</th>
                  <th className="px-6 py-3.5">Salary Structure</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {getEmpName(c.employee_id)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{c.department || 'General'}</div>
                      <div className="text-[10px] text-slate-400">{c.job_position || 'Staff'}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                      {formatCurrency(c.wage)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500">
                      {c.date_start} → {c.date_end || 'Open-ended'}
                    </td>
                    <td className="px-6 py-4 text-[#714b67] font-semibold">
                      {structures.find(s => s.id === c.salary_structure_id)?.name || 'Regular Monthly'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        c.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.is_active ? 'Active' : 'Expired'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/70 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create Employment Contract</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer border-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#714b67]/20 border-0"
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Base Monthly Wage (₹)</label>
                <input
                  type="number"
                  step="500"
                  required
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-900 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#714b67]/20 border-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#714b67]/20 border-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Position</label>
                  <input
                    type="text"
                    required
                    value={formData.job_position}
                    onChange={(e) => setFormData({ ...formData, job_position: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#714b67]/20 border-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Start</label>
                  <input
                    type="date"
                    required
                    value={formData.date_start}
                    onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none border-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date End (Optional)</label>
                  <input
                    type="date"
                    value={formData.date_end}
                    onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none border-0"
                  />
                </div>
              </div>

              {structures.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Structure</label>
                  <select
                    value={formData.salary_structure_id}
                    onChange={(e) => setFormData({ ...formData, salary_structure_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none border-0"
                  >
                    {structures.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer border-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#714b67] hover:bg-[#5e3d55] text-white text-xs font-semibold cursor-pointer border-0 shadow-xs"
                >
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
