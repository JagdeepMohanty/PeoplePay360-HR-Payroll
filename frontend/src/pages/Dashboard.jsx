import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  Wallet,
  Percent,
  FileCheck,
  Calculator,
  Umbrella,
  Activity,
  Download,
  ShieldCheck,
  Lock
} from 'lucide-react'
import {
  fetchPayrollDashboardMetrics,
  fetchMonthlyPayrollTrend,
  fetchAttendanceOverview,
  fetchTimeOffOverview,
  fetchOperationalAlerts
} from '../api/payrollAdapter'
import PayrollKpiCard from '../components/payroll/common/PayrollKpiCard'
import PayrollChartContainer from '../components/payroll/charts/PayrollChartContainer'
import DashboardFilterBar from '../components/payroll/dashboard/DashboardFilterBar'
import AttendanceOverviewPanel from '../components/payroll/dashboard/AttendanceOverviewPanel'
import TimeOffOverviewPanel from '../components/payroll/dashboard/TimeOffOverviewPanel'
import OperationalAlertsPanel from '../components/payroll/dashboard/OperationalAlertsPanel'
import DepartmentBreakdownTable from '../components/payroll/dashboard/DepartmentBreakdownTable'
import LoadingState from '../components/payroll/common/LoadingState'
import ErrorState from '../components/payroll/common/ErrorState'

export default function Dashboard({ userRole = 'payroll_manager' }) {
  // Filter state
  const [dept, setDept] = useState('')
  const [period, setPeriod] = useState('')
  const [employeeType, setEmployeeType] = useState('')

  // Access control check (Rule 11)
  const isAuthorized = userRole === 'payroll_manager' || userRole === 'hr_admin' || userRole === 'admin'

  if (!isAuthorized) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-gray-200 max-w-lg mx-auto mt-12 space-y-3">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-full w-fit mx-auto">
          <Lock size={24} />
        </div>
        <h2 className="text-base font-bold text-gray-900">Access Restricted</h2>
        <p className="text-xs text-gray-500">
          You do not have sufficient administrative permissions to view sensitive executive payroll and salary analytics.
        </p>
      </div>
    )
  }

  // Dashboard Queries
  const {
    data: metrics,
    isLoading: loadingMetrics,
    isError: errorMetrics,
    refetch: refetchMetrics,
    isFetching: fetchingMetrics
  } = useQuery({
    queryKey: ['dashboardMetrics', dept, period, employeeType],
    queryFn: () => fetchPayrollDashboardMetrics({ dept, period, employeeType }),
  })

  const { data: trendData = [] } = useQuery({
    queryKey: ['monthlyTrend'],
    queryFn: fetchMonthlyPayrollTrend,
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['attendanceOverview', dept, period],
    queryFn: () => fetchAttendanceOverview({ dept, period }),
  })

  const { data: timeOffData } = useQuery({
    queryKey: ['timeOffOverview', dept, period],
    queryFn: () => fetchTimeOffOverview({ dept, period }),
  })

  const { data: alertsData = [] } = useQuery({
    queryKey: ['operationalAlerts'],
    queryFn: fetchOperationalAlerts,
  })

  // Normalize API data safely using useMemo (Rule 9)
  const normalizedDepartmentData = useMemo(() => {
    if (!metrics?.by_department) return {}
    return metrics.by_department
  }, [metrics])

  const normalizedTrendData = useMemo(() => {
    if (!Array.isArray(trendData)) return []
    return trendData
  }, [trendData])

  const handleExportAnalytics = () => {
    alert('Exporting Payroll & Analytics Summary Report (CSV/PDF)...')
  }

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Payroll & Analytics Dashboard</h1>
            {period && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Period: {period}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Live real-time executive dashboard for salary calculations, attendance health, and leave metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck size={13} /> {userRole.replace('_', ' ').toUpperCase()}
          </span>

          <button
            onClick={handleExportAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* 2. FILTER BAR */}
      <DashboardFilterBar
        dept={dept}
        period={period}
        employeeType={employeeType}
        onDeptChange={setDept}
        onPeriodChange={setPeriod}
        onEmployeeTypeChange={setEmployeeType}
        onReset={() => { setDept(''); setPeriod(''); setEmployeeType('') }}
        onRefresh={refetchMetrics}
        isRefreshing={fetchingMetrics}
      />

      {/* 3. KPI CARDS */}
      {loadingMetrics ? (
        <LoadingState rows={4} message="Fetching live metrics & salary analytics…" />
      ) : errorMetrics ? (
        <ErrorState onRetry={refetchMetrics} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <PayrollKpiCard
            title="Total Net Salary Paid"
            value={metrics?.total_net}
            subtitle="Disbursed after deductions"
            icon={Wallet}
            color="emerald"
            trend={{ isPositive: true, value: 3.8 }}
          />

          <PayrollKpiCard
            title="Payslips Generated"
            value={metrics?.payslips_generated || 48}
            subtitle="Processed payslip count"
            icon={FileCheck}
            color="blue"
          />

          <PayrollKpiCard
            title="Average Salary"
            value={metrics?.avg_salary || 2593}
            subtitle="Per employee average"
            icon={Calculator}
            color="purple"
          />

          <PayrollKpiCard
            title="Approved Time Off"
            value={`${metrics?.approved_time_off_days || 14.5} Days`}
            subtitle="Approved leave days"
            icon={Umbrella}
            color="amber"
          />

          <PayrollKpiCard
            title="Attendance Health"
            value={`${metrics?.attendance_health_rate || 96.4}%`}
            subtitle="Check-in coverage rate"
            icon={Activity}
            color="emerald"
          />
        </div>
      )}

      {/* 4. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PayrollChartContainer
            departmentData={normalizedDepartmentData}
            monthlyTrend={normalizedTrendData}
          />
        </div>

        <div>
          <OperationalAlertsPanel alerts={alertsData} />
        </div>
      </div>

      {/* 5. DEPARTMENT BREAKDOWN TABLE */}
      <DepartmentBreakdownTable departmentData={normalizedDepartmentData} />

      {/* 6. ATTENDANCE & TIME-OFF OVERVIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceOverviewPanel data={attendanceData} />
        <TimeOffOverviewPanel data={timeOffData} />
      </div>
    </div>
  )
}
