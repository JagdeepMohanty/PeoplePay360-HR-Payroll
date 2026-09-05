import React from 'react'
import { Filter, RefreshCw, Calendar, Building } from 'lucide-react'

export default function DashboardFilterBar({
  dept = '',
  period = '',
  onDeptChange,
  onPeriodChange,
  onReset,
  isRefreshing = false,
}) {
  const departments = ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR']

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
        <Filter size={15} className="text-gray-500" />
        <span>Filters & Analytics Controls</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Department Select Filter */}
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
          <Building size={14} className="text-gray-400" />
          <select
            value={dept}
            onChange={(e) => onDeptChange(e.target.value)}
            className="bg-transparent text-gray-800 font-medium focus:outline-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Period Filter Input */}
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
          <Calendar size={14} className="text-gray-400" />
          <input
            type="text"
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            placeholder="Period (e.g. 2025-06)"
            className="bg-transparent text-gray-800 font-medium focus:outline-none w-32 placeholder-gray-400"
          />
        </div>

        {/* Clear Filters Button */}
        {(dept || period) && (
          <button
            onClick={onReset}
            className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  )
}
