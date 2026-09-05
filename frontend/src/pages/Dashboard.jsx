import { useState, useEffect } from 'react'
import { getDashboardMetrics } from '../api/dashboard'
import {
  DollarSign,
  Users,
  FileCheck,
  Calendar,
  Clock,
  Filter,
  BarChart2,
  TrendingUp,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('2025-07')
  const [department, setDepartment] = useState('')

  useEffect(() => {
    loadMetrics()
  }, [period, department])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const data = await getDashboardMetrics({ period, dept: department })
      setMetrics(data)
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  const summary = metrics?.summary || {}
  const byDept = metrics?.by_department || {}

  const deptChartData = Object.keys(byDept).map((deptName) => ({
    name: deptName,
    Gross: byDept[deptName].gross,
    Net: byDept[deptName].net,
    Deductions: byDept[deptName].deductions,
    Headcount: byDept[deptName].headcount,
  }))

  const pieData = Object.keys(byDept).map((deptName) => ({
    name: deptName,
    value: byDept[deptName].net || 1,
  }))

  const avgSalary = summary.payslip_count > 0 ? summary.total_net / summary.payslip_count : 0

  return (
    <div className="space-y-6">
      {/* Header & Live Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-brand-400" />
            <span>Payroll Analytics Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time workforce intelligence, salary distribution, and operational metrics
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-slate-400">Period:</span>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs">
            <span className="text-slate-400">Dept:</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none"
            >
              <option value="" className="bg-slate-900 text-white">All Departments</option>
              <option value="Engineering" className="bg-slate-900 text-white">Engineering</option>
              <option value="Human Resources" className="bg-slate-900 text-white">Human Resources</option>
              <option value="Finance" className="bg-slate-900 text-white">Finance</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold text-slate-400">Total Net Paid</span>
            <DollarSign className="w-5 h-5 p-1 rounded-lg bg-emerald-500/20" />
          </div>
          <div className="text-2xl font-black text-white">
            ${summary.total_net?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-emerald-400/80 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Gross: ${summary.total_gross?.toLocaleString() || '0'}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-xs font-semibold text-slate-400">Payslips Generated</span>
            <FileCheck className="w-5 h-5 p-1 rounded-lg bg-blue-500/20" />
          </div>
          <div className="text-2xl font-black text-white">
            {summary.payslip_count || 0}
          </div>
          <div className="text-[11px] text-blue-400/80 font-medium">
            Active Contracts: {summary.active_contracts || 0}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-semibold text-slate-400">Average Salary</span>
            <Users className="w-5 h-5 p-1 rounded-lg bg-purple-500/20" />
          </div>
          <div className="text-2xl font-black text-white">
            ${avgSalary ? Math.round(avgSalary).toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-purple-400/80 font-medium">
            Headcount: {summary.total_employees || 0}
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold text-slate-400">Approved Leaves</span>
            <Calendar className="w-5 h-5 p-1 rounded-lg bg-amber-500/20" />
          </div>
          <div className="text-2xl font-black text-white">
            {summary.approved_leaves || 0}
          </div>
          <div className="text-[11px] text-amber-400/80 font-medium">
            Pending Approval: {summary.pending_leaves || 0}
          </div>
        </div>

        {/* KPI 5 */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-pink-400">
            <span className="text-xs font-semibold text-slate-400">Attendance Hours</span>
            <Clock className="w-5 h-5 p-1 rounded-lg bg-pink-500/20" />
          </div>
          <div className="text-2xl font-black text-white">
            {summary.total_worked_hours || 0}h
          </div>
          <div className="text-[11px] text-pink-400/80 font-medium">
            Logs Count: {summary.attendance_count || 0}
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Department Salary Distribution (Bar Chart) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-brand-400" />
                <span>Department Salary Breakdown</span>
              </h3>
              <p className="text-xs text-slate-400">Gross vs Net salary payout per department</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="Gross" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Net" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No computed salary data for selected period/department.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Net Payout Distribution (Pie Chart) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-400" />
              <span>Net Payout Share</span>
            </h3>
            <p className="text-xs text-slate-400">Share of net salaries by department</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No data available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
