import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEmployee } from '../api/employees'
import SmartButtons from '../components/SmartButtons'
import {
  ArrowLeft,
  Mail,
  Building,
  Briefcase,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Receipt,
  UserCheck
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
      <div className="p-12 text-center text-slate-400 text-sm font-medium animate-pulse">
        Loading employee profile hub...
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="p-10 text-center space-y-4 bg-white rounded-2xl shadow-xs border-0">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-slate-800 font-semibold">Employee record not found.</div>
        <button
          onClick={() => navigate('/employees')}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border-0"
        >
          Back to Directory
        </button>
      </div>
    )
  }

  const empName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Employee'
  const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase() || 'EM'

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Back Link */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employees')}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employee Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            employee.is_active
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-600'
          }`}>
            {employee.is_active ? 'Active' : 'Archived'}
          </span>
        </div>
      </div>

      {/* Header Info Card */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border-0 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#714b67] to-[#8a5d7e] text-white font-black text-2xl flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{empName}</h2>
              <p className="text-sm font-medium text-[#714b67]">{employee.job_position || 'Staff Member'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{employee.department || 'General'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/contracts')}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-0"
            >
              <FileText className="w-3.5 h-3.5 text-[#714b67]" />
              <span>Contracts</span>
            </button>
            <button
              onClick={() => navigate('/attendance')}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-0"
            >
              <Clock className="w-3.5 h-3.5 text-[#00A09D]" />
              <span>Attendance</span>
            </button>
            <button
              onClick={() => navigate('/payruns')}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-0"
            >
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              <span>Payslips</span>
            </button>
          </div>
        </div>

        {/* Module B2: SmartButtons Bar */}
        <SmartButtons employee={employee} />

        {/* Detailed Form View Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-3 p-4 rounded-xl bg-slate-50/70 text-xs">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Identity & Role Details</h4>
            
            <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> Email</span>
              <span className="text-slate-900 font-semibold">{employee.email}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-slate-400" /> Department</span>
              <span className="text-slate-900 font-semibold">{employee.department || 'Unassigned'}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> Job Position</span>
              <span className="text-slate-900 font-semibold">{employee.job_position}</span>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-50/70 text-xs">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Work Schedule & Financials</h4>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Working Schedule</span>
              <span className="text-slate-900 font-semibold">Standard 40h Full-Time</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-slate-400" /> Bank Account</span>
              {employee.bank_account ? (
                <span className="text-emerald-700 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {employee.bank_account}
                </span>
              ) : (
                <span className="text-amber-600 font-bold flex items-center gap-1">
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
