import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from 'recharts'

export default function PayrollChartContainer({ departmentData = {}, monthlyTrend = [] }) {
  const [chartType, setChartType] = useState('department')

  const deptChartData = Object.entries(departmentData).map(([dept, v]) => ({
    name: dept,
    Gross: v?.gross || 0,
    Net: v?.net || 0,
    Deductions: v?.deductions || 0,
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Payroll Distribution & Analytics</h3>
          <p className="text-xs text-gray-500 mt-0.5">Departmental breakdown and month-over-month trend visualization</p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setChartType('department')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              chartType === 'department'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            By Department
          </button>
          <button
            onClick={() => setChartType('trend')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              chartType === 'trend'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly Trend
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        {chartType === 'department' ? (
          deptChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              No department payroll data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Gross" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        ) : (
          monthlyTrend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              No monthly trend data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="gross" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                <Area type="monotone" dataKey="net" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          )
        )}
      </div>
    </div>
  )
}
