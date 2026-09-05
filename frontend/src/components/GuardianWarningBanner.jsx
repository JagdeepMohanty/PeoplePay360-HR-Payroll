import { AlertTriangle, ShieldAlert } from 'lucide-react'

export default function GuardianWarningBanner({ warnings = [] }) {
  if (!warnings || warnings.length === 0) return null

  return (
    <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 shadow-xs border-0">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-100/80 text-amber-700 mt-0.5 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <span>Payroll Guardian: {warnings.length} Operational Issue{warnings.length > 1 ? 's' : ''} Detected</span>
          </h4>
          <p className="text-xs text-amber-700 mt-0.5">
            Resolve these operational warnings before final bank disbursement:
          </p>
          <ul className="mt-2.5 space-y-1.5 text-xs text-amber-900">
            {warnings.map((w, idx) => (
              <li key={idx} className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-xl shadow-2xs border-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  <strong className="font-semibold text-slate-900">{w.employee_name || `Employee #${w.employee_id}`}:</strong>{' '}
                  <span className="text-slate-600">{w.message}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
