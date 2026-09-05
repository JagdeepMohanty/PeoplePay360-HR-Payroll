import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, Clock, Umbrella,
  DollarSign, ChevronRight, Layers
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const navGroups = [
  {
    title: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Human Resources',
    items: [
      { to: '/employees', label: 'Employees', icon: Users },
      { to: '/attendance', label: 'Attendance', icon: Clock },
      { to: '/timeoff', label: 'Time Off', icon: Umbrella },
    ],
  },
  {
    title: 'Payroll & Compensation',
    items: [
      { to: '/contracts', label: 'Contracts', icon: FileText },
      { to: '/payruns', label: 'Payruns', icon: DollarSign, badge: 'Active' },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside className="w-60 border-r border-slate-200 bg-white flex flex-col justify-between h-screen shrink-0 select-none">
      {/* Odoo App Header */}
      <div className="h-13 p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-[#714b67] flex items-center justify-center text-white font-bold shadow-xs">
            <Layers className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-xs tracking-tight text-slate-900 flex items-center gap-1.5">
              PeoplePay360
              <span className="text-[10px] font-normal px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                Odoo 18
              </span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">Payroll & HRMS</span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h4 className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {group.title}
            </h4>
            <div className="space-y-0.5 pt-1">
              {group.items.map(({ to, label, icon: Icon, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#714b67]/10 text-[#714b67] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    <span>{label}</span>
                  </div>
                  {badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      {badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Section at bottom */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100/80 transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-7 w-7 border border-slate-200">
              <AvatarFallback className="bg-[#714b67]/15 text-[#714b67] text-xs font-semibold">
                LM
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-slate-800 truncate">Lucky Mohanty</span>
              <span className="text-[10px] text-slate-500 truncate">Payroll Officer</span>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        </div>
      </div>
    </aside>
  )
}
