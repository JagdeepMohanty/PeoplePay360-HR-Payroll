import { useNavigate } from 'react-router-dom'
import { FileText, Clock, Calendar, PieChart } from 'lucide-react'

export default function SmartButtons({ employee }) {
  const navigate = useNavigate()

  if (!employee) return null

  const buttons = [
    {
      label: 'Contracts',
      count: employee.contracts_count ?? 0,
      unit: '',
      icon: FileText,
      bg: 'bg-blue-50/80 hover:bg-blue-100/70 text-blue-700',
      iconBg: 'bg-blue-100/80 text-blue-600',
      path: `/contracts?employee_id=${employee.id}`,
    },
    {
      label: 'Attendance',
      count: employee.attendances_count ?? 0,
      unit: '',
      icon: Clock,
      bg: 'bg-purple-50/80 hover:bg-purple-100/70 text-purple-700',
      iconBg: 'bg-purple-100/80 text-purple-600',
      path: `/attendance?employee_id=${employee.id}`,
    },
    {
      label: 'Leaves',
      count: employee.leaves_count ?? 0,
      unit: '',
      icon: Calendar,
      bg: 'bg-amber-50/80 hover:bg-amber-100/70 text-amber-800',
      iconBg: 'bg-amber-100/80 text-amber-700',
      path: `/time-off?employee_id=${employee.id}`,
    },
    {
      label: 'Balance',
      count: employee.leave_balance ?? 0,
      unit: 'd',
      icon: PieChart,
      bg: 'bg-emerald-50/80 hover:bg-emerald-100/70 text-emerald-700',
      iconBg: 'bg-emerald-100/80 text-emerald-600',
      path: `/time-off?employee_id=${employee.id}`,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
      {buttons.map((btn, idx) => {
        const Icon = btn.icon
        return (
          <button
            key={idx}
            onClick={() => navigate(btn.path)}
            className={`flex items-center justify-between p-3.5 rounded-2xl ${btn.bg} border-0 shadow-xs transition-all duration-150 hover:-translate-y-0.5 text-left group cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${btn.iconBg} shadow-2xs`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold opacity-75">
                  {btn.label}
                </div>
                <div className="text-base font-black leading-tight text-slate-900 mt-0.5">
                  {btn.count}
                  {btn.unit}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
