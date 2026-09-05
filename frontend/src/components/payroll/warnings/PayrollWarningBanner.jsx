import React, { useState } from 'react'
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { WARNING_SEVERITY_STYLES } from '../../../types/payroll'

export default function PayrollWarningBanner({ warnings = [], onDismiss }) {
  const list = Array.isArray(warnings) ? warnings : []
  const [dismissedIds, setDismissedIds] = useState(new Set())

  if (!list.length) return null

  const activeWarnings = list.filter((_, idx) => !dismissedIds.has(idx))
  if (!activeWarnings.length) return null

  const icons = {
    critical: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const handleDismissOne = (idx) => {
    setDismissedIds(prev => new Set(prev).add(idx))
    if (onDismiss) onDismiss(idx)
  }

  return (
    <div className="space-y-2 mb-6">
      {activeWarnings.map((w, idx) => {
        const severity = w.severity || 'warning'
        const styleClass = WARNING_SEVERITY_STYLES[severity] || WARNING_SEVERITY_STYLES.warning
        const IconComponent = icons[severity] || AlertTriangle
        const messageText = typeof w === 'string' ? w : w.message || 'Payroll alert detected.'

        return (
          <div key={idx} className={`flex items-start justify-between p-3.5 rounded-lg border text-xs ${styleClass}`}>
            <div className="flex items-center gap-2.5">
              <IconComponent size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold capitalize mr-1">{severity}:</span>
                <span>{messageText}</span>
              </div>
            </div>
            <button
              onClick={() => handleDismissOne(idx)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
              title="Dismiss warning"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
