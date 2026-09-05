import { AlertTriangle, ShieldAlert } from 'lucide-react'

export default function GuardianWarningBanner({ warnings = [] }) {
  if (!warnings || warnings.length === 0) return null

  return (
    <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md shadow-lg">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <span>Payroll Guardian Detected {warnings.length} Operational Anomaly{warnings.length > 1 ? 's' : ''}</span>
          </h4>
          <p className="text-xs text-amber-200/80 mt-1">
            Please resolve the operational warnings below prior to payrun finalization:
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-amber-200">
            {warnings.map((w, idx) => (
              <li key={idx} className="flex items-center space-x-2 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>
                  <strong className="font-semibold text-amber-100">{w.employee_name || `Employee #${w.employee_id}`}:</strong>{' '}
                  {w.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
