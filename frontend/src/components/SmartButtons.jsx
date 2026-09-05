import { useNavigate } from 'react-router-dom'
import { FileText, Clock, Calendar, PieChart, ExternalLink } from 'lucide-react'

export default function SmartButtons({ employee }) {
  const navigate = useNavigate()

  if (!employee) return null

  const buttons = [
    {
      label: 'Contracts',
      count: employee.contracts_count ?? 0,
      unit: '',
      icon: FileText,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-300 hover:border-blue-400 hover:bg-blue-500/30',
      path: `/contracts?employee_id=${employee.id}`,
    },
    {
      label: 'Attendance',
      count: employee.attendances_count ?? 0,
      unit: '',
      icon: Clock,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300 hover:border-purple-400 hover:bg-purple-500/30',
      path: `/attendance?employee_id=${employee.id}`,
    },
    {
      label: 'Leaves',
      count: employee.leaves_count ?? 0,
      unit: '',
      icon: Calendar,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:bg-amber-500/30',
      path: `/time-off?employee_id=${employee.id}`,
    },
    {
      label: 'Allocations',
      count: employee.leave_balance ?? 0,
      unit: 'd',
      icon: PieChart,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/30',
      path: `/time-off?employee_id=${employee.id}`,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
      {buttons.map((btn, idx) => {
        const Icon = btn.icon
        const countDisplay = `${btn.count}${btn.unit}`
        return (
          <button
            key={idx}
            type="button"
            onClick={() => navigate(btn.path)}
            title={`View pre-filtered ${btn.label} for ${employee.full_name || 'employee'}`}
            className={`flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r ${btn.color} border backdrop-blur-md transition-all duration-200 hover:scale-[1.02] shadow-sm text-left group`}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-900/70 group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-tight">
                  {btn.label} ({countDisplay})
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-white transition-colors">
                  <span>Filtered view</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
