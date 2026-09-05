import { AlertTriangle } from 'lucide-react'

export default function GuardianWarningBanner({ warnings = [] }) {
  const list = Array.isArray(warnings) ? warnings : []
  if (!list.length) return null

  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 mb-4">
      <div className="flex items-center gap-2 mb-2 text-yellow-800 font-semibold text-sm">
        <AlertTriangle size={16} />
        Guardian Alerts ({list.length})
      </div>
      <ul className="space-y-1">
        {list.map((w, i) => (
          <li key={i} className="text-xs text-yellow-700">
            ⚠ {typeof w === 'string' ? w : (w?.message || JSON.stringify(w))}
          </li>
        ))}
      </ul>
    </div>
  )
}

