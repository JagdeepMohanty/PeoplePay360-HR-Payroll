import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLE_ACCOUNTS } from '../api/auth'
import {
  Users,
  FileText,
  Clock,
  Calendar,
  DollarSign,
  BarChart3,
  Shield,
  ChevronDown,
  UserCheck,
  LogOut,
  User,
  LayoutDashboard,
} from 'lucide-react'

export default function Navbar() {
  const { activeRole, employeeId, switchRole, changeEmployee, hasPermission, setShowAccessModal } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Map permissions to nav items
  const allNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
    {
      to: '/employees',
      label: hasPermission('employee:view:all') ? 'Employees' : 'My Details',
      icon: Users,
      permission: 'employee:view:own',
    },
    { to: '/contracts', label: 'Contracts', icon: FileText, permission: 'employee:view:all' },
    { to: '/attendance', label: 'Attendance', icon: Clock, permission: 'employee:view:own' },
    { to: '/time-off', label: 'Time Off', icon: Calendar, permission: 'employee:view:own' },
    {
      to: '/payruns',
      label: hasPermission('payroll:manage') || hasPermission('payroll:view:all') ? 'Payroll' : 'My Payroll',
      icon: DollarSign,
      permission: 'payroll:view:own',
    },
    { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'employee:view:all' },
  ]

  // Filter allowed items based on active permissions
  const permittedNavItems = allNavItems.filter((item) => {
    if (!item.permission) return true
    return hasPermission(item.permission)
  })

  const getRoleBadgeColor = (role) => {
    const r = (role || '').toLowerCase()
    switch (r) {
      case 'hr_payroll':
      case 'hr_payroll_manager':
      case 'admin':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'hr':
      case 'hr_manager':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'employee':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      default:
        return 'bg-brand-500/20 text-brand-300 border-brand-500/30'
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              PeoplePay360
            </h1>
            <p className="text-xs text-brand-400 font-medium">Workforce-to-Payroll Engine</p>
          </div>
        </div>

        {/* Primary Dynamic Nav Items */}
        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto w-full md:w-auto py-1">
          {permittedNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-brand-600/30 text-white border border-brand-500/40 shadow-sm shadow-brand-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Employee ID & Role Info & Quick Switcher */}
        <div className="flex items-center space-x-2.5">
          {/* Change Employee / Exit Button */}
          <button
            type="button"
            onClick={changeEmployee}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-500 transition-all"
            title="Change Employee ID or Switch Role"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Change Employee</span>
          </button>

          {/* User Persona Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl glass-card border border-slate-700/60 text-slate-200 hover:border-slate-500 transition-all text-xs font-semibold"
            >
              <User className="w-4 h-4 text-brand-400" />
              <div className="text-left">
                <div className="text-[10px] text-slate-400 leading-none">
                  {employeeId ? `ID: ${employeeId}` : 'Active Role'}
                </div>
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold border mt-0.5 uppercase ${getRoleBadgeColor(
                    activeRole
                  )}`}
                >
                  {activeRole || 'guest'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl glass-panel border border-slate-700 shadow-2xl z-50 p-2 space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>RBAC Persona Switcher</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false)
                    setShowAccessModal(true)
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold bg-brand-600/20 text-brand-300 hover:bg-brand-600/40 flex items-center justify-between border border-brand-500/30 transition-all"
                >
                  <span>Enter Employee ID</span>
                  <UserCheck className="w-4 h-4" />
                </button>
                <div className="pt-1 border-t border-slate-800/80">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                    Legacy Persona Presets
                  </div>
                  {ROLE_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      onClick={() => {
                        switchRole(acc.role)
                        setDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex flex-col transition-colors ${
                        activeRole === acc.role
                          ? 'bg-brand-600/30 text-white font-bold border border-brand-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span>{acc.label}</span>
                        <span className="text-[10px] opacity-75">{acc.role}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
