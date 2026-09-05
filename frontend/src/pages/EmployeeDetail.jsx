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
import { Separator } from '@/components/ui/separator'

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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button and Actions Header */}
      <div className="flex items-center justify-between">
        <Link to="/employees">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to Employees
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            Edit Profile
          </Button>
          <Link to="/contracts">
            <Button size="sm" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> View Contract
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-md">
                <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    {employee.name}
                  </h1>
                  <Badge variant="success" className="text-xs">
                    {employee.status || 'Active'}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {employee.job_position} · {employee.department}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    {employee.work_email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    {employee.work_phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stat Pills */}
            <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
              <div className="p-3 rounded-lg bg-muted/40 border border-border text-center">
                <span className="text-[11px] text-muted-foreground block">Leaves Left</span>
                <span className="text-base font-bold text-foreground tabular-nums">14 Days</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border text-center">
                <span className="text-[11px] text-muted-foreground block">Attendance</span>
                <span className="text-base font-bold text-emerald-400 tabular-nums">98.5%</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border text-center">
                <span className="text-[11px] text-muted-foreground block">Monthly Wage</span>
                <span className="text-base font-bold text-primary tabular-nums">₹1.75L</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Work Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Work Information</CardTitle>
            <CardDescription className="text-xs">
              Organizational hierarchy and role parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium text-foreground">{employee.department}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Job Position</span>
              <span className="font-medium text-foreground">{employee.job_position}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Manager</span>
              <span className="font-medium text-foreground">{employee.manager_name || 'Vikram Mehta'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Work Location</span>
              <span className="font-medium text-foreground">Bangalore Tech Hub (HQ)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Joining Date</span>
              <span className="font-medium text-foreground">{employee.date_joined || '12 Jan 2023'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Compensation & Contract */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Compensation & Compliance</CardTitle>
            <CardDescription className="text-xs">
              Payroll structure and statutory identifiers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Contract Type</span>
              <span className="font-medium text-foreground">{employee.contract_type || 'Full-time'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Monthly Base Salary</span>
              <span className="font-semibold text-primary tabular-nums">
                ₹{employee.wage ? employee.wage.toLocaleString('en-IN') : '1,75,000'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">PF / UAN Number</span>
              <span className="font-mono text-muted-foreground">101293847562</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">ESI Applicable</span>
              <Badge variant="outline" className="text-[10px]">Exempt (Above Ceiling)</Badge>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Bank Account</span>
              <span className="font-mono text-foreground">HDFC •••• 4829</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
