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
      title: 'Monthly Gross Payroll',
      value: formatCurrency(apiData?.total_payroll || 11250000),
      trend: '+3.4% vs last period',
      icon: DollarSign,
      iconBg: 'bg-[#714b67]/10 text-[#714b67]',
    },
    {
      title: 'Active Employees',
      value: (apiData?.active_employees || 92).toString(),
      trend: '4 joined this month',
      icon: Users,
      iconBg: 'bg-teal-50 text-teal-700',
    },
    {
      title: 'Average Net Salary',
      value: formatCurrency(apiData?.avg_salary || 102170),
      trend: 'Standard across grades',
      icon: TrendingUp,
      iconBg: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Pending Exceptions',
      value: '3 Actions',
      trend: 'Requires sign-off before payout',
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-700',
      badge: 'Attention',
    },
  ]

  return (
    <div className="space-y-5">
      {/* Top Action Bar (Odoo Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Payroll Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            OXP Enterprise compensation metrics, biometric sync, and payout cycles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 py-1 px-2.5 bg-white text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-[#714b67]" />
            <span>Cycle: September 2026</span>
          </Badge>
          <Link to="/payruns">
            <Button className="gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              New Payrun Batch
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {kpi.title}
                  </span>
                  <div className={`p-1.5 rounded ${kpi.iconBg}`}>
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
                      <Badge variant="warning" className="text-[10px] px-1.5 py-0">
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Department Gross vs Net */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Department Payroll Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Gross budgeted payroll vs Net paid to bank
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-[#714b67]" />
                  <span className="text-slate-600 text-[11px]">Gross</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-[#00a09d]" />
                  <span className="text-slate-600 text-[11px]">Net</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fallbackDeptData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="department"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                  formatter={(val) => [formatCurrency(val), '']}
                />
                <Bar dataKey="gross" fill="#714b67" radius={[3, 3, 0, 0]} maxBarSize={32} />
                <Bar dataKey="net" fill="#00a09d" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 6-Month Trajectory Area */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Disbursement Trend
            </CardTitle>
            <CardDescription className="text-xs">
              Last 6 cycles aggregate company expenditure
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fallbackTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="odooGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#714b67" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#714b67" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                  formatter={(val) => [formatCurrency(val), 'Payroll Total']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#714b67"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#odooGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table & Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Department Overview Table */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Department Summary</h3>
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
                <TableHead className="text-center">Employees</TableHead>
                <TableHead className="text-right">Monthly Gross</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fallbackDeptData.map((d) => (
                <TableRow key={d.department}>
                  <TableCell className="font-medium text-slate-900">
                    {d.department}
                  </TableCell>
                  <TableCell className="text-center text-slate-600">
                    {d.employees}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-slate-900">
                    {formatCurrency(d.gross)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="success" className="text-[10px]">
                      Ready
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Pre-payrun Checklist */}
        <Card className="p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Pre-Payrun Checklist
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Tasks required before executing batch</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200/80 space-y-1">
              <div className="font-semibold text-amber-900">2 Pending Time-off Requests</div>
              <p className="text-[11px] text-amber-800/80">
                Awaiting approval in Engineering and Operations.
              </p>
              <Link to="/timeoff" className="inline-block pt-0.5 text-xs text-[#714b67] font-semibold hover:underline">
                Approve Requests →
              </Link>
            </div>

            <div className="p-2.5 rounded bg-blue-50/70 border border-blue-200/80 space-y-1">
              <div className="font-semibold text-blue-900">1 Contract Due for Revision</div>
              <p className="text-[11px] text-blue-800/80">
                Fixed-term engineer contract expires this cycle.
              </p>
              <Link to="/contracts" className="inline-block pt-0.5 text-xs text-[#714b67] font-semibold hover:underline">
                Review Contract →
              </Link>
            </div>

            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-medium text-slate-800">Biometrics Synced</div>
                  <span className="text-[10px] text-slate-500">Device Terminal 01</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">Active</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
