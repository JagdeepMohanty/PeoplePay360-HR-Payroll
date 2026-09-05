import React from 'react'
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react'

export default function OperationalAlertsPanel({ alerts = [] }) {
  const list = Array.isArray(alerts) && alerts.length > 0 ? alerts : [
    { id: 1, title: 'Missing Bank Details', description: 'Employee David Smith (#3) has no bank details set.', severity: 'warning' },
    { id: 2, title: 'Contract Expiration Warning', description: 'Employee Olivia Taylor (#7) contract expired on 2025-05-31.', severity: 'critical' },
  ]

  const icons = {
    critical: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const styles = {
    critical: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-amber-600" size={18} />
          <h3 className="text-sm font-bold text-gray-900">Operational & Guardian Alerts ({list.length})</h3>
        </div>
      </div>

      <div className="space-y-2.5">
        {list.map((item) => {
          const IconComponent = icons[item.severity] || AlertTriangle
          const styleClass = styles[item.severity] || styles.warning
          return (
            <div key={item.id} className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${styleClass}`}>
              <IconComponent size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{item.title}</p>
                <p className="mt-0.5 opacity-90">{item.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
