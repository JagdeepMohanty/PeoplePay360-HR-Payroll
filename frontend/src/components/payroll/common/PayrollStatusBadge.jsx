import React from 'react'
import { PAYROLL_STATUS_COLORS } from '../../../types/payroll'

export default function PayrollStatusBadge({ status = 'draft', size = 'normal' }) {
  const normalized = String(status).toLowerCase()
  const colorClass = PAYROLL_STATUS_COLORS[normalized] || PAYROLL_STATUS_COLORS.draft
  const padding = size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold'

  return (
    <span className={`inline-flex items-center rounded-full border ${colorClass} ${padding} capitalize`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {normalized}
    </span>
  )
}
