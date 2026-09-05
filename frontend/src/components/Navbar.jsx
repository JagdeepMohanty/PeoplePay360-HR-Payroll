import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Search, Clock, LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function Navbar() {
  const [time, setTime] = useState(new Date())
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const location = useLocation()

  // Dynamic breadcrumb based on current path
  const getBreadcrumb = () => {
    const path = location.pathname
    if (path === '/') return 'Dashboard'
    if (path.startsWith('/employees')) return 'Employees'
    if (path.startsWith('/attendance')) return 'Attendance'
    if (path.startsWith('/timeoff')) return 'Time Off'
    if (path.startsWith('/contracts')) return 'Contracts'
    if (path.startsWith('/payruns')) return 'Payruns'
    return 'Overview'
  }

  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Attendance work timer
  useEffect(() => {
    let interval = null
    if (isCheckedIn) {
      interval = setInterval(() => setSessionSeconds((s) => s + 1), 1000)
    } else {
      setSessionSeconds(0)
    }
    return () => clearInterval(interval)
  }, [isCheckedIn])

  const formatTimer = (totalSeconds) => {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const s = String(totalSeconds % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  return (
    <header className="h-12 border-b border-slate-200 bg-white px-5 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Odoo Style Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-slate-500">Payroll</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-800">{getBreadcrumb()}</span>
      </div>

      {/* Center Search Bar */}
      <div className="relative w-72 hidden sm:block">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search..."
          className="pl-8 h-7 text-xs bg-slate-50/70 border-slate-200 focus:bg-white transition-colors"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200/80">
          <Clock className="h-3 w-3 text-[#714b67]" />
          <span className="tabular-nums font-medium">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Attendance Action Widget */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-1.5 py-1 rounded border border-slate-200">
          {isCheckedIn && (
            <div className="flex items-center gap-1 px-1.5 text-xs text-emerald-700 font-mono">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-medium">{formatTimer(sessionSeconds)}</span>
            </div>
          )}

          <Button
            size="sm"
            variant={isCheckedIn ? "destructive" : "teal"}
            onClick={() => setIsCheckedIn(!isCheckedIn)}
            className="h-6 px-2 text-[11px] font-medium"
          >
            {isCheckedIn ? (
              <>
                <LogOut className="h-3 w-3 mr-1" /> Check Out
              </>
            ) : (
              <>
                <LogIn className="h-3 w-3 mr-1" /> Check In
              </>
            )}
          </Button>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-800">
          <Bell className="h-3.5 w-3.5" />
        </Button>

        {/* User Profile */}
        <Avatar className="h-7 w-7 border border-slate-200">
          <AvatarFallback className="bg-[#714b67]/15 text-[#714b67] text-[11px] font-semibold">
            LM
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
