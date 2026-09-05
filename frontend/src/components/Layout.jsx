import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-5 md:p-6 bg-[#f9fafb]">
          <div className="max-w-7xl mx-auto space-y-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
