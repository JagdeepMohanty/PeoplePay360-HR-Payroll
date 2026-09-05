import { useState, useEffect } from 'react'
import { Bell, Search, Clock, LogIn, LogOut, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function Navbar() {
  const [time, setTime] = useState(new Date())
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)

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
    <header className="h-14 border-b border-border bg-card/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Search Input */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search employees, payroll, contracts..."
          className="pl-9 bg-background/50 h-9 border-border/80 text-xs focus-visible:ring-primary/40"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Live Local Clock */}
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-md border border-border/50">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="tabular-nums font-medium">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-[10px] text-muted-foreground/80">IST</span>
        </div>

        {/* Quick Check-In / Check-Out Action Widget */}
        <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-lg border border-border/60">
          {isCheckedIn && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs text-emerald-400 font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{formatTimer(sessionSeconds)}</span>
            </div>
          )}

          <Button
            size="sm"
            variant={isCheckedIn ? "destructive" : "default"}
            onClick={() => setIsCheckedIn(!isCheckedIn)}
            className="h-7 px-3 text-xs gap-1.5 font-medium transition-all"
          >
            {isCheckedIn ? (
              <>
                <LogOut className="h-3.5 w-3.5" />
                Check Out
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5" />
                Check In
              </>
            )}
          </Button>
        </div>

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* Profile Avatar */}
        <Avatar className="h-8 w-8 border border-border">
          <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
            LM
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
