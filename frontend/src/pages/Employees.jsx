import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getEmployees, createEmployee } from '../api/employees'
import {
  Users,
  LayoutGrid,
  List,
  Search,
  Plus,
  Building,
  Briefcase,
  Mail,
  X,
  Check,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'

export default function Employees() {
  const { activeRole } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' | 'list'
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    department: 'Engineering',
    job_position: 'Software Engineer',
    bank_account: '',
    is_active: true,
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const data = await getEmployees()
      setEmployees(data || [])
    } catch (err) {
      console.error('Failed to load employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createEmployee(formData)
      setIsModalOpen(false)
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        department: 'Engineering',
        job_position: 'Software Engineer',
        bank_account: '',
        is_active: true,
      })
      loadEmployees()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail && detail.includes('Operation not permitted')) {
        alert("Operation not permitted for role 'EMPLOYEE'. Please switch to 'Admin' or 'HR Manager' using the persona switcher in the top-right navbar.")
      } else {
        alert(detail || 'Failed to create employee.')
      }
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const name = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase()
    const matchesSearch = name.includes(search.toLowerCase()) || (emp.email || '').toLowerCase().includes(search.toLowerCase())
    const matchesDept = department ? emp.department === department : true
    return matchesSearch && matchesDept
  })

  const departments = ['All', 'Engineering', 'Human Resources', 'Finance']

  return (
    <div className="space-y-5">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white shadow-xs border-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#714b67]" />
            <span>Employees Directory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {employees.length} total active personnel with active contracts & smart metrics
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-slate-50 text-slate-800 text-xs font-medium placeholder:text-slate-400 border-0 outline-none focus:bg-white focus:ring-2 focus:ring-[#714b67]/20"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-50 p-1 rounded-full border-0">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-full text-xs transition-all border-0 cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Kanban Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full text-xs transition-all border-0 cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Create Employee Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#714b67] hover:bg-[#5e3e56] text-white text-xs font-semibold shadow-xs transition-all border-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Employee</span>
          </button>
        </div>
      </div>

      {/* Department Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        {departments.map((dept) => {
          const isSelected = dept === 'All' ? !department : department === dept
          return (
            <button
              key={dept}
              onClick={() => setDepartment(dept === 'All' ? '' : dept)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#714b67] text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              {dept}
            </button>
          )
        })}
      </div>

      {/* Content: Kanban Cards */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-white p-4 rounded-2xl shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer space-y-3.5 group border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#714b67]/10 text-[#714b67] font-bold text-sm flex items-center justify-center shrink-0">
                  {emp.first_name?.[0] || 'E'}
                  {emp.last_name?.[0] || ''}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#714b67] transition-colors truncate">
                    {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium truncate">{emp.job_position || 'Staff'}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                  Active
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-2 text-[11px]">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span className="truncate">{emp.department || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span className="truncate text-slate-400">{emp.email}</span>
                </div>
              </div>

              {/* Smart Badges Summary */}
              <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                <span>Contracts: <strong className="text-slate-700">{emp.contracts_count ?? 0}</strong></span>
                <span>Balance: <strong className="text-emerald-600">{emp.leave_balance ?? 0}d</strong></span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View Mode */
        <div className="overflow-hidden rounded-2xl bg-white shadow-xs border-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Job Position</th>
                <th className="px-4 py-3">Contracts</th>
                <th className="px-4 py-3">Leave Balance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                    <span className="block text-[10px] text-slate-400 font-normal">{emp.email}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{emp.department}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.job_position}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{emp.contracts_count ?? 0}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">{emp.leave_balance ?? 0} days</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      className="px-3 py-1 rounded-full bg-slate-100 hover:bg-[#714b67] hover:text-white text-slate-700 font-medium text-xs transition-colors border-0 cursor-pointer"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border-0">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#714b67]/10 text-[#714b67]">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Create New Employee</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-0 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {activeRole === 'EMPLOYEE' && (
                <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Current role is <strong>Employee (Self-Service)</strong>. Switch to <strong>Admin</strong> or <strong>HR Manager</strong> in the top navbar to create employees.
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Job Position</label>
                  <input
                    type="text"
                    required
                    value={formData.job_position}
                    onChange={(e) => setFormData({ ...formData, job_position: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Account (IBAN)</label>
                <input
                  type="text"
                  placeholder="GB29NWBK60161331926819"
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#714b67]/20 border-0 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 border-0 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#714b67] hover:bg-[#5e3e56] text-white text-xs font-semibold shadow-xs border-0 cursor-pointer">
                  <Check className="w-3.5 h-3.5" />
                  <span>Create Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
