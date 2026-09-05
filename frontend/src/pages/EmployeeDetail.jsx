import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEmployee, updateEmployee } from '../api/employees'
import SmartButtons from '../components/SmartButtons'
import {
  Users,
  ArrowLeft,
  Mail,
  Building,
  Briefcase,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  X,
} from 'lucide-react'

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState('')

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    job_position: '',
    bank_account: '',
    is_active: true,
  })

  useEffect(() => {
    loadEmployee()
  }, [id])

  const loadEmployee = async () => {
    setLoading(true)
    try {
      const data = await getEmployee(id)
      setEmployee(data)
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        department: data.department || 'Engineering',
        job_position: data.job_position || 'Software Engineer',
        bank_account: data.bank_account || '',
        is_active: data.is_active ?? true,
      })
    } catch (err) {
      console.error('Failed to load employee profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateEmployee(id, formData)
      setEmployee(updated)
      setIsEditing(false)
      setNotification('Employee profile updated successfully!')
      setTimeout(() => setNotification(''), 3500)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update employee profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Loading employee profile hub...
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="p-8 text-center text-red-400 text-sm space-y-4">
        <div>Employee record not found.</div>
        <button onClick={() => navigate('/employees')} className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold">
          Back to Directory
        </button>
      </div>
    )
  }

  const empName = employee.full_name || `${employee.first_name} ${employee.last_name}`

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Back Link */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employees')}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            employee.is_active
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/20 text-red-300 border-red-500/30'
          }`}>
            {employee.is_active ? 'ACTIVE EMPLOYEE' : 'INACTIVE'}
          </span>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600/30 hover:bg-brand-600 text-white font-bold text-xs border border-brand-500/30 shadow-sm transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Form</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Info Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              {employee.first_name?.[0]}
              {employee.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{empName}</h2>
              <p className="text-sm font-semibold text-brand-400">{employee.job_position || 'Staff Member'} &bull; {employee.department || 'General'}</p>
            </div>
          </div>
        </div>

        {/* SmartButtons Bar: dynamic counts routed to pre-filtered modules */}
        <SmartButtons employee={employee} />

        {/* Unified Employee Form: View & Edit Modes */}
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider">Identity & Role Details</h4>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
                <span className="text-white font-semibold">{employee.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Department</span>
                <span className="text-white font-semibold">{employee.department || 'Unassigned'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Job Position</span>
                <span className="text-white font-semibold">{employee.job_position}</span>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider">Work Schedule & Financials</h4>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Working Schedule</span>
                <span className="text-white font-semibold">Standard 40h Full-Time</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Bank Account</span>
                {employee.bank_account ? (
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {employee.bank_account}
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Missing Bank Account
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-brand-500/40">
              <h4 className="font-bold text-brand-300 uppercase tracking-wider">Edit Identity & Role</h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Job Position</label>
                <input
                  type="text"
                  required
                  value={formData.job_position}
                  onChange={(e) => setFormData({ ...formData, job_position: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-brand-500/40">
              <h4 className="font-bold text-brand-300 uppercase tracking-wider">Edit Financials & Status</h4>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bank Account Number (IBAN / ACH)</label>
                <input
                  type="text"
                  placeholder="e.g. US44CHAS92019482"
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Required for automated bank wire transfer and pre-validation checks.
                </span>
              </div>

              <div className="pt-4 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="emp_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="emp_active" className="text-slate-300 font-semibold cursor-pointer">
                  Active Status (Eligible for contract & payroll generation)
                </label>
              </div>

              <div className="pt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
