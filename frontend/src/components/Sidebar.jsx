import { NavLink } from 'react-router-dom'
import odooLogo from '../assets/odoo_logo.png'
import {
  LayoutDashboard, Users, FileText, Clock, Umbrella,
  DollarSign, ChevronRight, Layers, Sliders, CalendarCheck
} from 'lucide-react'


const navGroups = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Human Resources',
    items: [
      { to: '/employees', label: 'Employees', icon: Users },
      { to: '/attendance', label: 'Attendance', icon: Clock },
      { to: '/time-off', label: 'Time Off', icon: Umbrella },
      { to: '/schedules', label: 'Work Schedules', icon: CalendarCheck },
    ],
  },
  {
    title: 'Payroll & Compliance',
    items: [
      { to: '/contracts', label: 'Contracts', icon: FileText },
      { to: '/payruns', label: 'Payruns', icon: DollarSign, badge: 'Active' },
      { to: '/structures', label: 'Salary Structures', icon: Sliders },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white shadow-[1px_0_4px_rgba(0,0,0,0.03)] flex flex-col justify-between h-screen shrink-0 select-none z-20">
      {/* Odoo App Header */}
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={odooLogo} alt="Odoo" className="h-7 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="font-semibold text-xs tracking-tight text-slate-900 flex items-center gap-1.5">
              PeoplePay360
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                Odoo 18
              </span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Payroll Guardian</span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h4 className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {group.title}
            </h4>
            <div className="space-y-0.5 pt-0.5">
              {group.items.map(({ to, label, icon: Icon, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
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
                    <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-teal-50 text-teal-700">
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
      <div className="p-3 bg-slate-50/60">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-full bg-[#714b67]/15 text-[#714b67] text-xs font-semibold flex items-center justify-center">
              LM
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-slate-800 truncate">Lucky Mohanty</span>
              <span className="text-[10px] text-slate-400 truncate">Payroll Officer</span>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        </div>
      </div>
    </aside>
  )
}
