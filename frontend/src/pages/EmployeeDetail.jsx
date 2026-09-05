import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, Building2, MapPin, Calendar,
  Clock, FileText, Umbrella, Shield, CheckCircle2, DollarSign
} from 'lucide-react'
import { getEmployees } from '../api/employees'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function EmployeeDetail() {
  const { id } = useParams()

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        const res = await getEmployees()
        return res?.data || []
      } catch {
        return []
      }
    },
  })

  const employee = employees?.find((e) => String(e.id) === String(id)) || {
    id: id || 1,
    name: 'Aarav Sharma',
    job_position: 'Tech Lead',
    department: 'Engineering',
    work_email: 'aarav.sharma@oxp.com',
    work_phone: '+91 98765 43210',
    manager_name: 'Vikram Mehta',
    contract_type: 'Full-time Permanent',
    wage: 175000,
    date_joined: '12 Jan 2023',
    status: 'Active',
  }

  const getInitials = (name) => {
    if (!name) return 'EM'
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Odoo Form Action Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Link to="/employees">
            <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          </Link>
          <Button size="sm" className="h-7 text-xs">
            Edit
          </Button>
        </div>

        {/* Odoo Smart Buttons */}
        <div className="flex items-center gap-1.5">
          <Link to="/timeoff">
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-2 border-slate-200">
              <Umbrella className="h-3.5 w-3.5 text-[#714b67]" />
              <div className="text-left">
                <span className="text-[10px] text-slate-500 block leading-none">Time Off</span>
                <span className="font-semibold text-slate-900 leading-none">14 Days</span>
              </div>
            </Button>
          </Link>
          <Link to="/attendance">
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-2 border-slate-200">
              <Clock className="h-3.5 w-3.5 text-teal-600" />
              <div className="text-left">
                <span className="text-[10px] text-slate-500 block leading-none">Attendance</span>
                <span className="font-semibold text-slate-900 leading-none">98.5%</span>
              </div>
            </Button>
          </Link>
          <Link to="/contracts">
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-2 border-slate-200">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <div className="text-left">
                <span className="text-[10px] text-slate-500 block leading-none">Contracts</span>
                <span className="font-semibold text-slate-900 leading-none">1 Active</span>
              </div>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Odoo Sheet */}
      <Card className="p-6">
        {/* Header with Photo & Name */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-5 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-slate-200">
              <AvatarFallback className="bg-[#714b67]/10 text-[#714b67] text-lg font-bold">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{employee.name}</h2>
                <Badge variant="success" className="text-[10px]">
                  {employee.status || 'Active'}
                </Badge>
              </div>
              <p className="text-xs font-medium text-slate-600">
                {employee.job_position} · {employee.department}
              </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          {/* Column 1: Work Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              Work Information
            </h3>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 py-1 border-b border-slate-50">
                <span className="text-slate-500">Department</span>
                <span className="col-span-2 font-medium text-slate-900">{employee.department}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-50">
                <span className="text-slate-500">Job Position</span>
                <span className="col-span-2 font-medium text-slate-900">{employee.job_position}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-50">
                <span className="text-slate-500">Manager</span>
                <span className="col-span-2 font-medium text-slate-900">{employee.manager_name || 'Vikram Mehta'}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-50">
                <span className="text-slate-500">Work Location</span>
                <span className="col-span-2 font-medium text-slate-900">Bangalore HQ</span>
              </div>
              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-500">Working Hours</span>
                <span className="col-span-2 font-medium text-slate-900">Standard 40 hours/week</span>
              </div>
            </div>
          </div>

          {/* Column 2: Compensation & Payroll */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              Payroll & Contract Details
            </h3>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 py-1 border-b border-slate-50">
                <span className="text-slate-500">Contract Type</span>
                <span className="col-span-2 font-medium text-slate-900">{employee.contract_type || 'Permanent'}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-50">
                <span className="text-slate-500">Monthly Wage</span>
                <span className="col-span-2 font-semibold text-[#714b67] tabular-nums">
                  ₹{employee.wage ? employee.wage.toLocaleString('en-IN') : '1,75,000'}
                </span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-50">
                <span className="text-slate-500">PF Number</span>
                <span className="col-span-2 font-mono text-slate-700">101293847562</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-50">
                <span className="text-slate-500">Bank Account</span>
                <span className="col-span-2 font-mono text-slate-700">HDFC •••• 4829</span>
              </div>
              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-500">Joining Date</span>
                <span className="col-span-2 font-medium text-slate-900">{employee.date_joined || '12 Jan 2023'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
