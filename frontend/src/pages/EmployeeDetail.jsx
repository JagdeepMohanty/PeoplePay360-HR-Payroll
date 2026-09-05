import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, Building2, MapPin, Calendar,
  Clock, FileText, Umbrella, Shield, CheckCircle2, DollarSign,
  Edit2, Save, X
} from 'lucide-react'
import { usePayroll } from '@/context/PayrollContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    employees,
    updateEmployee,
    contracts,
    attendance,
    timeOffRequests,
    leaveBalances,
    permissions
  } = usePayroll()

  const employee = employees.find((e) => String(e.id) === String(id)) || employees[0] || {
    id: 1,
    name: 'Aarav Sharma',
    job_position: 'Tech Lead',
    department: 'Engineering',
    work_email: 'aarav.sharma@oxp.com',
    work_phone: '+91 98765 43210',
    manager_name: 'Vikram Mehta',
    contract_type: 'Full-time Permanent',
    wage: 175000,
    date_joined: '2023-01-12',
    status: 'Active',
  }

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ ...employee })

  // Smart Button Counts (Requirement B2)
  const empContractsCount = contracts.filter(c => c.employee === employee.name || c.employee_id === employee.id).length
  const empAttendanceCount = attendance.filter(a => a.employee === employee.name).length
  const empTimeOffCount = timeOffRequests.filter(t => t.employee === employee.name).length
  const totalAllocatedLeaves = leaveBalances.reduce((acc, b) => acc + b.remaining, 0)

  const getInitials = (name) => {
    if (!name) return 'EM'
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase()
  }

  const handleSave = () => {
    updateEmployee(employee.id, formData)
    setIsEditing(false)
  }

  const toggleStatus = () => {
    const nextStatus = employee.status === 'Active' ? 'On Leave' : 'Active'
    updateEmployee(employee.id, { status: nextStatus })
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Odoo Form Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <Link to="/employees">
            <Button variant="outline" size="sm" className="gap-1 text-xs h-7 shadow-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Employees
            </Button>
          </Link>

          {permissions.canManageHR && (
            <>
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <Button size="sm" onClick={handleSave} className="h-7 text-xs gap-1 shadow-xs">
                    <Save className="h-3 w-3" /> Save Changes
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-7 text-xs">
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-7 text-xs gap-1 shadow-xs">
                  <Edit2 className="h-3 w-3" /> Edit Profile
                </Button>
              )}
            </>
          )}
        </div>

        {/* B2) Odoo Smart Buttons with Live Dynamic Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <Link to="/time-off">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-xs hover:bg-slate-50 transition-all text-xs text-left">
              <Umbrella className="h-3.5 w-3.5 text-[#714b67]" />
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Time Off</span>
                <span className="font-bold text-slate-900 leading-tight tabular-nums">{empTimeOffCount} Requests</span>
              </div>
            </button>
          </Link>

          <Link to="/attendance">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-xs hover:bg-slate-50 transition-all text-xs text-left">
              <Clock className="h-3.5 w-3.5 text-teal-600" />
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Attendance</span>
                <span className="font-bold text-slate-900 leading-tight tabular-nums">{empAttendanceCount} Days Logged</span>
              </div>
            </button>
          </Link>

          <Link to="/contracts">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-xs hover:bg-slate-50 transition-all text-xs text-left">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Contracts</span>
                <span className="font-bold text-slate-900 leading-tight tabular-nums">{empContractsCount} Active</span>
              </div>
            </button>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-xs text-xs text-left">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Leave Balance</span>
              <span className="font-bold text-slate-900 leading-tight tabular-nums">{totalAllocatedLeaves} Days Left</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Odoo Sheet */}
      <Card className="p-6 space-y-6">
        {/* Header with Photo & Name */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-5 pb-6 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-0 shadow-sm">
              <AvatarFallback className="bg-[#714b67]/10 text-[#714b67] text-lg font-bold">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-8 text-lg font-bold w-64 bg-slate-50"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-slate-900">{employee.name}</h2>
                )}

                <button
                  type="button"
                  onClick={toggleStatus}
                  title="Click to toggle status"
                  className="cursor-pointer"
                >
                  <Badge
                    variant={employee.status === 'On Leave' ? 'warning' : 'success'}
                    className="text-[10px]"
                  >
                    {employee.status || 'Active'}
                  </Badge>
                </button>
              </div>

              {isEditing ? (
                <Input
                  value={formData.job_position}
                  onChange={(e) => setFormData({ ...formData, job_position: e.target.value })}
                  className="h-7 text-xs w-48 bg-slate-50"
                  placeholder="Job Position"
                />
              ) : (
                <p className="text-xs font-medium text-slate-600">
                  {employee.job_position} · {employee.department}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-400" /> {employee.work_email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-400" /> {employee.work_phone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields 2-Column Notebook */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 1: Work Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1">
              Work Information
            </h3>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400">Department</span>
                {isEditing ? (
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="col-span-2 h-7 rounded-lg border-0 bg-slate-100/90 px-2 text-xs"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="HR">HR</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                ) : (
                  <span className="col-span-2 font-semibold text-slate-800">{employee.department}</span>
                )}
              </div>

              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400">Job Position</span>
                <span className="col-span-2 font-medium text-slate-800">{employee.job_position}</span>
              </div>

              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400">Manager</span>
                <span className="col-span-2 font-medium text-slate-800">{employee.manager_name || 'Vikram Mehta'}</span>
              </div>

              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400">Work Location</span>
                <span className="col-span-2 font-medium text-slate-800">Bangalore HQ Tech Park</span>
              </div>

              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400">Working Hours</span>
                <span className="col-span-2 font-medium text-slate-800">Standard 40 hours/week</span>
              </div>
            </div>
          </div>

          {/* Column 2: Compensation & Payroll */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1">
              Payroll & Contract Details
            </h3>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400">Contract Type</span>
                <span className="col-span-2 font-medium text-slate-800">{employee.contract_type || 'Permanent'}</span>
              </div>

              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400">Monthly Wage</span>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                    className="col-span-2 h-7 text-xs bg-slate-50 font-mono"
                  />
                ) : (
                  <span className="col-span-2 font-bold text-[#714b67] tabular-nums">
                    ₹{employee.wage ? employee.wage.toLocaleString('en-IN') : '1,75,000'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400">PF / UAN</span>
                <span className="col-span-2 font-mono text-slate-700">101293847562</span>
              </div>

              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400">Bank Account</span>
                <span className="col-span-2 font-mono text-slate-700">HDFC •••• 4829</span>
              </div>

              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400">Joining Date</span>
                <span className="col-span-2 font-medium text-slate-800">{employee.date_joined || '2023-01-12'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
