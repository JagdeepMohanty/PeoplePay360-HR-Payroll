import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
      <footer className="glass-panel border-t border-slate-800/80 py-4 text-center text-xs text-slate-400">
        PeoplePay360 HR & Payroll Engine &copy; 2025. Built with FastAPI & React.
      </footer>
    </div>
  )
}
