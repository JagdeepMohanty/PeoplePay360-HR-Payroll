import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Wallet, Percent, Users } from 'lucide-react'
import { fetchPayrollDashboardMetrics } from '../api/payrollAdapter'
import PayrollKpiCard from '../components/payroll/common/PayrollKpiCard'
import PayrollChartContainer from '../components/payroll/charts/PayrollChartContainer'
import DashboardFilterBar from '../components/payroll/dashboard/DashboardFilterBar'
import LoadingState from '../components/payroll/common/LoadingState'
import ErrorState from '../components/payroll/common/ErrorState'

export default function Dashboard() {
  const [dept, setDept] = useState('')
  const [period, setPeriod] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', dept, period],
    queryFn: () => fetchPayrollDashboardMetrics({ dept, period }),
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Payroll & Analytics Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time breakdown of gross pay, net pay, and statutory deductions</p>
        </div>
      </div>

      <DashboardFilterBar
        dept={dept}
        period={period}
        onDeptChange={setDept}
        onPeriodChange={setPeriod}
        onReset={() => { setDept(''); setPeriod('') }}
      />

      {isLoading ? (
        <LoadingState rows={4} message="Computing department analytics & totals…" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <PayrollKpiCard
              title="Total Gross Pay"
              value={data?.total_gross}
              subtitle="All running contracts"
              icon={DollarSign}
              color="blue"
              trend={{ isPositive: true, value: 4.2 }}
            />
            <PayrollKpiCard
              title="Total Net Payable"
              value={data?.total_net}
              subtitle="After deductions"
              icon={Wallet}
              color="emerald"
              trend={{ isPositive: true, value: 3.8 }}
            />
            <PayrollKpiCard
              title="Total Deductions"
              value={data?.total_deductions}
              subtitle="Taxes & Benefits"
              icon={Percent}
              color="amber"
            />
            <PayrollKpiCard
              title="Active Headcount"
              value={data?.active_employees || 48}
              subtitle="Eligible employees"
              icon={Users}
              color="purple"
            />
          </div>

          <PayrollChartContainer
            departmentData={data?.by_department || {}}
            monthlyTrend={[]}
          />
        </>
      )}
    </div>
  )
}


