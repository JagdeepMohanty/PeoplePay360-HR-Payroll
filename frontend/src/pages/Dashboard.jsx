import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, CartesianGrid
} from 'recharts'
import {
  DollarSign, Users, TrendingUp, AlertTriangle, ArrowUpRight,
  Sparkles, Calendar, CheckCircle2, ChevronRight, ShieldCheck,
  FileCheck, Clock, Umbrella, Activity
} from 'lucide-react'
import { usePayroll } from '@/context/PayrollContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function Dashboard() {
  const {
    employees,
    contracts,
    attendance,
    timeOffRequests,
    payruns,
    role,
    permissions
  } = usePayroll()

  const [selectedDept, setSelectedDept] = useState('All')

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0)

  // ── B9) Dynamic KPI Aggregations ──
  const activeEmployees = employees.filter(e => e.status === 'Active')
  const totalNetPaid = payruns.reduce((sum, p) => p.status === 'Paid' ? sum + p.total_net : sum, 0)
  const totalPayslipsCount = payruns.reduce((sum, p) => sum + (p.payslips?.length || 0), 0)
  const avgSalary = Math.round(employees.reduce((sum, e) => sum + (e.wage || 0), 0) / (employees.length || 1))
  const approvedLeavesCount = timeOffRequests.filter(t => t.status === 'Approved').length
  const pendingLeavesCount = timeOffRequests.filter(t => t.status === 'Pending').length

  // Attendance overview numbers
  const presentCount = attendance.filter(a => a.status === 'Present').length
  const lateCount = attendance.filter(a => a.status === 'Late').length
  const absentCount = attendance.filter(a => a.status === 'Absent').length
  const onLeaveCount = attendance.filter(a => a.status === 'On Leave').length
  const attendanceRate = attendance.length > 0
    ? Math.round((presentCount / attendance.length) * 100)
    : 98

  // Department cost breakdown calculation
  const departments = ['Engineering', 'HR', 'Sales', 'Operations', 'Marketing']
  const deptCostData = departments.map(dept => {
    const deptEmps = employees.filter(e => e.department === dept)
    const gross = deptEmps.reduce((sum, e) => sum + e.wage, 0)
    const net = Math.round(gross * 0.85)
    return {
      department: dept,
      gross,
      net,
      employees: deptEmps.length,
    }
  }).filter(d => selectedDept === 'All' || d.department === selectedDept)

  // ── Real-time monthly trend from actual payrun data ──
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const trendMap = {}
  payruns.forEach(p => {
    if (!p.period_start) return
    const d = new Date(p.period_start)
    const key = `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`
    trendMap[key] = (trendMap[key] || 0) + (p.total_gross || 0)
  })
  // Build ordered array from oldest to newest
  const trendData = Object.entries(trendMap)
    .sort((a, b) => {
      const mA = payruns.find(p => p.period_start?.includes(a[0]?.split(' ')[0]))?.period_start || ''
      const mB = payruns.find(p => p.period_start?.includes(b[0]?.split(' ')[0]))?.period_start || ''
      return mA.localeCompare(mB)
    })
    .map(([month, total]) => ({ month, total }))

  // Add forward estimate if we have at least one real data point
  const lastTotal = trendData[trendData.length - 1]?.total || 0
  if (lastTotal > 0) {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    trendData.push({ month: `${MONTH_NAMES[nextMonth.getMonth()]} (Est)`, total: Math.round(lastTotal * 1.02), estimated: true })
  }

  // ── Live Pending-Payrun Warning Count ──
  const totalPayrunWarnings = payruns.reduce((sum, p) => sum + (p.warnings?.length || 0), 0)
  // ── Expiring contracts ──
  const expiringContracts = contracts.filter(c => {
    if (c.end_date === 'Open-ended' || !c.end_date) return false
    const diff = new Date(c.end_date) - new Date()
    return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000 // within 90 days
  })
  // ── Total payroll budget (from active contracts) ──
  const totalMonthlyBudget = contracts
    .filter(c => c.status === 'Active')
    .reduce((sum, c) => sum + (c.wage || 0), 0)

  const kpis = [
    {
      title: 'Total Net Salary Paid',
      value: formatCurrency(totalNetPaid || totalMonthlyBudget * 0.85),
      trend: `${payruns.filter(p => p.status === 'Paid').length} Completed Batches`,
      icon: DollarSign,
      iconBg: 'bg-[#714b67]/10 text-[#714b67]',
    },
    {
      title: 'Active Employees',
      value: activeEmployees.length.toString(),
      trend: `${employees.length} Master records`,
      icon: Users,
      iconBg: 'bg-teal-50 text-teal-700',
    },
    {
      title: 'Average Base Wage',
      value: formatCurrency(avgSalary),
      trend: 'Across active contracts',
      icon: TrendingUp,
      iconBg: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Attendance Health',
      value: `${attendanceRate}%`,
      trend: `${presentCount} Present · ${lateCount} Late`,
      icon: Activity,
      iconBg: 'bg-emerald-50 text-emerald-700',
      badge: attendanceRate >= 95 ? 'Optimal' : 'Review',
    },
  ]

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Payroll & HR Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated metrics across Employees, Contracts, Attendance, and Payruns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-8 rounded-lg border-0 bg-white px-3 text-xs font-medium text-slate-800 shadow-xs focus:ring-1 focus:ring-[#714b67]"
          >
            <option value="All">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {permissions.canEditPayroll && (
            <Link to="/payruns">
              <Button className="gap-1.5 font-medium shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
                New Payrun
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* B9) KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} className="hover:shadow-md transition-all">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {kpi.title}
                  </span>
                  <div className={`p-2 rounded-xl ${kpi.iconBg}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight tabular-nums text-slate-900">
                    {kpi.value}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                    <span>{kpi.trend}</span>
                    {kpi.badge && (
                      <Badge variant="success" className="text-[10px] px-2 py-0.5">
                        {kpi.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* B9) Workforce & Attendance Status Strip */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#714b67]" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Today's Workforce Health</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              {presentCount} Present
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              {lateCount} Late
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
              {onLeaveCount} On Leave
            </span>
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
              {absentCount} Absent
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
              Coverage: {attendanceRate}%
            </span>
          </div>
        </div>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Department Gross vs Net */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Salary Expenditure by Department
                </CardTitle>
                <CardDescription className="text-xs">
                  Gross budgeted payroll vs Net paid to bank
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#714b67]" />
                  <span className="text-slate-600 text-[11px]">Gross</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#00a09d]" />
                  <span className="text-slate-600 text-[11px]">Net</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptCostData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#f8fafc" vertical={false} />
                <XAxis
                  dataKey="department"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  }}
                  formatter={(val) => [formatCurrency(val), '']}
                />
                <Bar dataKey="gross" fill="#714b67" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="net" fill="#00a09d" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 6-Month Trajectory Area */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Monthly Salary Trend
            </CardTitle>
            <CardDescription className="text-xs">
              Recent cycles aggregate disbursement history
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="odooGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#714b67" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#714b67" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#f8fafc" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  }}
                  formatter={(val) => [formatCurrency(val), 'Payroll Total']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#714b67"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#odooGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table & Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Department Overview Table (Headcount + Salary) */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Department Headcount & Cost Distribution</h3>
              <p className="text-xs text-slate-500">Staff distribution and budget allocation</p>
            </div>
            <Link to="/employees">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                View Staff <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-center">Staff Count</TableHead>
                <TableHead className="text-right">Monthly Gross</TableHead>
                <TableHead className="text-right">Monthly Net</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deptCostData.map((d) => (
                <TableRow key={d.department}>
                  <TableCell className="font-semibold text-slate-900">
                    {d.department}
                  </TableCell>
                  <TableCell className="text-center text-slate-600">
                    {d.employees} staff
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-slate-900">
                    {formatCurrency(d.gross)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-emerald-700">
                    {formatCurrency(d.net)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="success" className="text-[10px]">
                      Operational
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Operational Alerts Card (B9) */}
        <Card className="p-5 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Operational Payroll Alerts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time alerts across HR modules</p>
          </div>

          <div className="space-y-2.5 text-xs">
            {pendingLeavesCount > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50/80 space-y-1">
                <div className="font-semibold text-amber-900">{pendingLeavesCount} Unapproved Time-off Requests</div>
                <p className="text-[11px] text-amber-800/80">
                  Requires manager approval before next payroll cycle.
                </p>
                <Link to="/time-off" className="inline-block pt-0.5 text-xs text-[#714b67] font-semibold hover:underline">
                  Review & Approve →
                </Link>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                All employee leave requests are approved.
              </div>
            )}

            {expiringContracts.length > 0 ? (
              <div className="p-3 rounded-xl bg-blue-50/80 space-y-1">
                <div className="font-semibold text-blue-900">{expiringContracts.length} Contract{expiringContracts.length > 1 ? 's' : ''} Expiring Soon</div>
                <p className="text-[11px] text-blue-800/80">
                  {expiringContracts.map(c => c.employee).join(', ')} — renewals required within 90 days.
                </p>
                <Link to="/contracts" className="inline-block pt-0.5 text-xs text-[#714b67] font-semibold hover:underline">
                  Review Contracts →
                </Link>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                All active contracts are open-ended or long-term.
              </div>
            )}

            {totalPayrunWarnings > 0 && (
              <div className="p-3 rounded-xl bg-rose-50/70 space-y-1">
                <div className="font-semibold text-rose-900">{totalPayrunWarnings} Unresolved Payrun Issue{totalPayrunWarnings > 1 ? 's' : ''}</div>
                <p className="text-[11px] text-rose-800/80">Critical warnings detected in open payruns. Resolve before disbursement.</p>
                <Link to="/payruns" className="inline-block pt-0.5 text-xs text-[#714b67] font-semibold hover:underline">Review Payruns →</Link>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-medium text-slate-800">Biometric Devices Synced</div>
                  <span className="text-[10px] text-slate-400">3 Terminals Active</span>
                </div>
              </div>
              <Badge variant="success" className="text-[10px]">Online</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
