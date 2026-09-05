import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, CartesianGrid
} from 'recharts'
import {
  DollarSign, Users, TrendingUp, AlertTriangle, ArrowUpRight,
  Sparkles, Calendar, CheckCircle2, ChevronRight, FileSpreadsheet
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import client from '../api/client'

// Fallback high-fidelity sample data matching Excalidraw mockup
const fallbackDeptData = [
  { department: 'Engineering', gross: 4200000, net: 3450000, employees: 34 },
  { department: 'Sales', gross: 2800000, net: 2320000, employees: 22 },
  { department: 'Operations', gross: 1900000, net: 1580000, employees: 18 },
  { department: 'Human Resources', gross: 1250000, net: 1040000, employees: 10 },
  { department: 'Marketing', gross: 1100000, net: 920000, employees: 8 },
]

const fallbackTrendData = [
  { month: 'Apr', total: 9800000 },
  { month: 'May', total: 10200000 },
  { month: 'Jun', total: 10600000 },
  { month: 'Jul', total: 10900000 },
  { month: 'Aug', total: 11100000 },
  { month: 'Sep', total: 11250000 },
]

export default function Dashboard() {
  const [selectedDept, setSelectedDept] = useState('All')

  const { data: apiData } = useQuery({
    queryKey: ['dashboard-metrics', selectedDept],
    queryFn: async () => {
      const res = await client.get('/api/v1/reports/dashboard', {
        params: selectedDept !== 'All' ? { dept: selectedDept } : {},
      })
      return res.data
    },
    retry: false,
  })

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val)

  const kpis = [
    {
      title: 'Total Monthly Payroll',
      value: formatCurrency(apiData?.total_payroll || 11250000),
      trend: '+3.4% from last period',
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      title: 'Active Employees',
      value: (apiData?.active_employees || 92).toString(),
      trend: '4 onboarded this month',
      icon: Users,
      color: 'text-emerald-400',
    },
    {
      title: 'Average Net Salary',
      value: formatCurrency(apiData?.avg_salary || 102170),
      trend: 'Stable across bands',
      icon: TrendingUp,
      color: 'text-blue-400',
    },
    {
      title: 'Pending Exceptions',
      value: '3 Items',
      trend: 'Requires review before run',
      icon: AlertTriangle,
      color: 'text-amber-400',
      badge: 'Attention',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Payroll & Workforce Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time biometric attendance, salary disbursements, and compliance metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 py-1.5 px-3 bg-muted/30">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>September 2026</span>
          </Badge>
          <Link to="/payruns">
            <Button className="gap-2 shadow-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Process New Payrun
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} className="hover:border-primary/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-muted/40 ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                  {kpi.value}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">{kpi.trend}</p>
                  {kpi.badge && (
                    <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                      {kpi.badge}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Department Gross vs Net Comparison */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Department Cost Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Gross payroll vs Net disbursements by department
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Gross</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="text-muted-foreground">Net</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fallbackDeptData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="department"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [formatCurrency(val), '']}
                />
                <Bar dataKey="gross" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="net" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 6-Month Trend Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Disbursement Trajectory
            </CardTitle>
            <CardDescription className="text-xs">
              Last 6-month aggregate company payroll expenses
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fallbackTrendData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [formatCurrency(val), 'Monthly Total']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#payrollGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Summary Table & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Department Overview</CardTitle>
              <CardDescription className="text-xs">
                Headcount and monthly gross totals per team
              </CardDescription>
            </div>
            <Link to="/employees">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Staff Count</TableHead>
                  <TableHead className="text-right">Monthly Gross</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fallbackDeptData.map((d) => (
                  <TableRow key={d.department}>
                    <TableCell className="font-medium text-foreground">
                      {d.department}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {d.employees} members
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-foreground">
                      {formatCurrency(d.gross)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success" className="text-[10px]">
                        Up to Date
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Actionable Alerts Card */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Pre-Payrun Checklist
            </CardTitle>
            <CardDescription className="text-xs">
              System flags detected for the upcoming cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
              <div className="font-semibold text-amber-400">2 Unapproved Time Offs</div>
              <p className="text-muted-foreground text-[11px]">
                Pending manager signoff in Engineering and Operations.
              </p>
              <Link to="/timeoff" className="inline-block pt-1 text-amber-400 hover:underline font-medium">
                Resolve Requests →
              </Link>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
              <div className="font-semibold text-blue-400">1 Contract Renewal Due</div>
              <p className="text-muted-foreground text-[11px]">
                Contract for Senior React Engineer expires on 30 Sep 2026.
              </p>
              <Link to="/contracts" className="inline-block pt-1 text-blue-400 hover:underline font-medium">
                Review Contract →
              </Link>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium text-foreground">Biometric Logs Synced</div>
                  <p className="text-[11px] text-muted-foreground">OXP Terminal device 01</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">Verified</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
