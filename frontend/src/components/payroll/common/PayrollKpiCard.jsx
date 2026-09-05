import React from 'react'

export default function PayrollKpiCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) {
  const formattedValue = typeof value === 'number' ? `$${value.toLocaleString()}` : value || '$0'

  const badgeColors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formattedValue}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${badgeColors[color] || badgeColors.blue}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          <span className={trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </span>
          <span className="text-gray-400">vs last period</span>
        </div>
      )}
    </div>
  )
}
