import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react'
import { getEmployee } from '../api/employees'
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
} from 'lucide-react'

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmployee()
  }, [id])

  const loadEmployee = async () => {
    setLoading(true)
    try {
      const data = await getEmployee(id)
      setEmployee(data)
    } catch (err) {
      console.error('Failed to load employee profile:', err)
    } finally {
      setLoading(false)
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

        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
          employee.is_active
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : 'bg-red-500/20 text-red-300 border-red-500/30'
        }`}>
          {employee.is_active ? 'ACTIVE EMPLOYEE' : 'INACTIVE'}
        </span>
      </div>

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
              <p className="text-sm font-semibold text-brand-400">{employee.job_position || 'Staff Member'}</p>
            </div>
          </div>
        </div>

        {/* Module B2: SmartButtons Bar */}
        <SmartButtons employee={employee} />

        {/* Detailed Form View Grid */}
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
      </div>
    </div>
  )
}
