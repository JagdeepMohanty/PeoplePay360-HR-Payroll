import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert, ShieldCheck } from 'lucide-react'

export default function Layout() {
  const { activeRole, switchRole } = useAuth()

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-[#714b67] selection:text-white antialiased">
      {activeRole === 'EMPLOYEE' && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 max-w-7xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 text-white shrink-0" />
              <span>
                You are currently logged in with the <strong>Employee (Self-Service)</strong> role. Managerial operations (creating employees, contracts, payruns) require <strong>HR Manager</strong> or <strong>Admin</strong> rights.
              </span>
            </div>
            <button
              onClick={() => switchRole('ADMIN')}
              className="px-3 py-1 bg-white text-amber-900 font-bold rounded-lg hover:bg-amber-50 transition-colors shadow-2xs cursor-pointer border-0 flex items-center gap-1.5 shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Switch to Admin</span>
            </button>
          </div>
        </div>
      )}
      <Navbar />
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-2 md:px-3 lg:px-4 py-4 space-y-4">
        <Outlet />
      </main>
      <footer className="bg-white/80 py-4 text-center text-xs text-slate-400 border-0 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
        PeoplePay360 · Intelligent Workforce-to-Payroll Engine
      </footer>
    </div>
  )
}
