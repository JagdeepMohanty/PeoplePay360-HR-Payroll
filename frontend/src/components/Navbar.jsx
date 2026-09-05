import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLE_ACCOUNTS } from '../api/auth'
import { getEmployees } from '../api/employees'
import odooLogo from '../assets/odoo_logo.png'
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
  Search,
  Check,
} from 'lucide-react'

export default function Navbar() {
  const { activeRole, activeEmployeeName, switchRole, switchToEmployee, user } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [employees, setEmployees] = useState([])
  const [employeeSearch, setEmployeeSearch] = useState('')

  const navItems = [
    { to: '/employees', label: 'Employees', icon: Users },
    { to: '/contracts', label: 'Contracts', icon: FileText },
    { to: '/attendance', label: 'Attendance', icon: Clock },
    { to: '/time-off', label: 'Time Off', icon: Calendar },
    { to: '/payruns', label: 'Payroll', icon: DollarSign },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ]

  useEffect(() => {
    if (dropdownOpen && employees.length === 0) {
      getEmployees()
        .then((data) => setEmployees(data || []))
        .catch((err) => console.error('Failed to load employee list for switcher:', err))
    }
  }, [dropdownOpen])

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100/70 text-purple-700 font-semibold'
      case 'HR_MANAGER':
        return 'bg-blue-100/70 text-blue-700 font-semibold'
      case 'HR_PAYROLL_USER':
        return 'bg-teal-100/70 text-teal-700 font-semibold'
      case 'HR_PAYROLL_MANAGER':
        return 'bg-emerald-100/70 text-emerald-700 font-semibold'
      case 'EMPLOYEE':
        return 'bg-amber-100/70 text-amber-800 font-semibold'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const filteredEmployees = employees.filter((e) => {
    const fullName = e.full_name || `${e.first_name || ''} ${e.last_name || ''}`
    return (
      fullName.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (e.email || '').toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (e.department || '').toLowerCase().includes(employeeSearch.toLowerCase())
    )
  })

  const currentDisplayName = activeRole === 'EMPLOYEE' && activeEmployeeName
    ? activeEmployeeName
    : activeRole.replace(/_/g, ' ')

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0 px-4 lg:px-6 py-3 select-none">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 max-w-[1440px] mx-auto w-full">
        {/* Brand & App Title */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <img src={odooLogo} alt="Odoo" className="h-8 w-auto object-contain" />
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[15px] font-bold tracking-tight text-slate-900 block leading-none">
                PeoplePay<span className="text-[#714b67]">360</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium block mt-1 leading-none">Enterprise Payroll ERP</span>
            </div>
          </div>

          {/* Role Switcher Pill for mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-xs border-0 ${getRoleBadgeStyle(activeRole)}`}
            >
              <Shield className="w-3 h-3" />
              <span>{currentDisplayName}</span>
            </button>
          </div>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all shrink-0 border-0 ${
                    isActive
                      ? 'bg-[#714b67] text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Right Controls: Role Switcher & User info */}
        <div className="hidden md:flex items-center gap-3 relative">
          {/* Live API Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 shadow-2xs border-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>FastAPI Live</span>
          </div>

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all shadow-xs border-0 ${getRoleBadgeStyle(
                activeRole
              )} hover:opacity-90 cursor-pointer`}
              title="Click to switch 5-Tier RBAC Persona or choose employee"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="font-medium text-[11px] opacity-75">Persona:</span>
              <span className="font-bold truncate max-w-[140px]">{currentDisplayName}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl p-2 z-50 space-y-2 border-0 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
                  {/* Current Account Indicator */}
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged In As</p>
                    <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                      {activeRole === 'EMPLOYEE' && activeEmployeeName ? activeEmployeeName : user?.email || 'Admin'}
                    </p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-100 text-[#714b67]">
                      {activeRole}
                    </span>
                  </div>

                  {/* Section 1: Core RBAC Personas */}
                  <div className="space-y-1">
                    <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Core 5-Tier Roles</p>
                    {ROLE_ACCOUNTS.filter(a => a.role !== 'EMPLOYEE').map((acc) => (
                      <button
                        key={acc.role}
                        onClick={() => {
                          switchRole(acc.role)
                          setDropdownOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors border-0 cursor-pointer ${
                          activeRole === acc.role
                            ? 'bg-[#714b67] text-white font-bold shadow-xs'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span className="block font-semibold">{acc.label}</span>
                          <span className="text-[10px] opacity-75 block">{acc.email}</span>
                        </div>
                        {activeRole === acc.role && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>

                  {/* Section 2: Employee Portal Switcher (Select Any Employee!) */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="px-3 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Switch Employee Persona ({employees.length || '105+'})
                      </p>
                    </div>

                    {/* Search Input for Employees */}
                    <div className="px-2">
                      <div className="relative">
                        <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search employee by name..."
                          value={employeeSearch}
                          onChange={(e) => setEmployeeSearch(e.target.value)}
                          className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-slate-50 text-[11px] text-slate-800 border-0 outline-none focus:bg-white focus:ring-1 focus:ring-[#714b67]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                      {filteredEmployees.slice(0, 15).map((emp) => {
                        const empFullName = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`
                        const isCurrent = activeRole === 'EMPLOYEE' && (user?.employee_id === emp.id || activeEmployeeName === empFullName)

                        return (
                          <button
                            key={emp.id}
                            onClick={() => {
                              switchToEmployee(emp.id, empFullName)
                              setDropdownOpen(false)
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors border-0 cursor-pointer ${
                              isCurrent
                                ? 'bg-amber-100 text-amber-900 font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="truncate">
                              <span className="block font-semibold text-[11px] truncate">{empFullName}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{emp.job_position || emp.department}</span>
                            </div>
                            {isCurrent && <UserCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                          </button>
                        )
                      })}

                      {filteredEmployees.length === 0 && (
                        <p className="px-3 py-2 text-[11px] text-slate-400 text-center">
                          {employees.length === 0 ? 'Loading employees...' : 'No employees matching search'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
