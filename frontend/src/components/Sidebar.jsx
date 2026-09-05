import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, Clock, Umbrella,
  DollarSign, ShieldCheck, ChevronRight, Sparkles, Building2
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
    title: 'Payroll & Finance',
    items: [
      { to: '/contracts', label: 'Contracts', icon: FileText },
      { to: '/payruns', label: 'Payruns', icon: DollarSign, badge: 'Active' },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col justify-between h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              PeoplePay360
              <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/30 text-primary">v2.4</Badge>
            </span>
            <span className="text-xs text-muted-foreground truncate">OXP Enterprise Suite</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h4 className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {group.title}
            </h4>
            <div className="space-y-0.5 pt-1">
              {group.items.map(({ to, label, icon: Icon, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{label}</span>
                  </div>
                  {badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                      {badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom User / Team Card */}
      <div className="p-3 border-t border-sidebar-border bg-card/40">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-sidebar-accent/60 transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-8 w-8 border-border">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                LM
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-foreground truncate">Lucky Mohanty</span>
              <span className="text-[11px] text-muted-foreground truncate">HR Administrator</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    </aside>
  )
}
