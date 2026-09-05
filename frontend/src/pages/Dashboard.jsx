import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getDashboard } from '../api/dashboard'

export default function Dashboard() {
  const [dept, setDept] = useState('')
  const [period, setPeriod] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', dept, period],
    queryFn: () => getDashboard({ dept, period }),
  })

  const chartData = data?.by_department
    ? Object.entries(data.by_department).map(([name, v]) => ({
        name,
        Gross: v?.gross || 0,
        Net: v?.net || 0,
      }))
    : []

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Live Payroll Dashboard</h1>

      <div className="flex gap-3 mb-6">
        <input value={dept} onChange={e => setDept(e.target.value)}
          placeholder="Filter by department" className="border rounded-md px-3 py-1.5 text-sm" />
        <input value={period} onChange={e => setPeriod(e.target.value)}
          placeholder="Filter by period (e.g. 2025-07)" className="border rounded-md px-3 py-1.5 text-sm" />
      </div>

      {isLoading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Gross', value: data?.total_gross },
              { label: 'Total Net', value: data?.total_net },
              { label: 'Total Deductions', value: data?.total_deductions },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">${(value ?? 0).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Gross vs Net by Department</p>
            {chartData.length === 0 ? (
              <p className="text-xs text-gray-400 py-10 text-center">No department analytics data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="Gross" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Net" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  )
}

