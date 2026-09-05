import React from 'react'
import { Filter, RefreshCw, Calendar, Building, UserCheck } from 'lucide-react'

export default function DashboardFilterBar({
  dept = '',
  period = '',
  employeeType = '',
  onDeptChange,
  onPeriodChange,
  onEmployeeTypeChange,
  onReset,
  onRefresh,
  isRefreshing = false,
}) {
  const departments = ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR']
  const employeeTypes = ['Full-Time', 'Contractor', 'Intern']

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
        <Filter size={15} className="text-gray-500" />
        <span>Live Analytics Filters</span>
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

        {/* Employee Type Filter */}
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
          <UserCheck size={14} className="text-gray-400" />
          <select
            value={employeeType}
            onChange={(e) => onEmployeeTypeChange(e.target.value)}
            className="bg-transparent text-gray-800 font-medium focus:outline-none cursor-pointer"
          >
            <option value="">All Employee Types</option>
            {employeeTypes.map((t) => (
              <option key={t} value={t}>
                {t}
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

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 bg-gray-50 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
        )}

        {/* Clear Filters Button */}
        {(dept || period || employeeType) && (
          <button
            onClick={onReset}
            className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium transition-colors border border-rose-100 bg-rose-50 rounded-lg"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  )
}
