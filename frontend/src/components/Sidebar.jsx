import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, Clock, Umbrella, DollarSign } from 'lucide-react'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/contracts', label: 'Contracts', icon: FileText },
  { to: '/attendance', label: 'Attendance', icon: Clock },
  { to: '/time-off', label: 'Time Off', icon: Umbrella },
  { to: '/payruns', label: 'Payruns', icon: DollarSign },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-brand-900 text-white flex flex-col">
      <div className="px-5 py-4 text-lg font-bold tracking-wide border-b border-brand-700">
        PeoplePay360
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-brand-700 text-white' : 'text-blue-200 hover:bg-brand-700'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
