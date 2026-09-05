import { useState, useEffect } from 'react'
import { Bell, Search, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default function Navbar() {
  const [time, setTime] = useState(new Date())
  const [checkIn, setCheckIn] = useState(false)
  const [showWidget, setShowWidget] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [sessionStart, setSessionStart] = useState(null)

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    if (!checkIn) { setElapsed(0); return }
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [checkIn])

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  const handleToggle = () => {
    if (!checkIn) setSessionStart(new Date())
    setCheckIn(v => !v)
  }

  return (
    <header style={{
      height: 54,
      background: 'var(--color-bg-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 12,
      position: 'relative',
      zIndex: 20,
    }}>
      {/* Search bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '5px 10px',
        flex: '0 0 240px',
        cursor: 'text',
      }}>
        <Search size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <input
          placeholder="Search employees, payslips…"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--color-text-primary)',
            fontSize: '0.8125rem',
            width: '100%',
            fontFamily: 'var(--font-family)',
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Date / Time */}
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em' }}>
        {time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        {' '}·{' '}
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
      </div>

      {/* Attendance Widget */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowWidget(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: checkIn ? 'var(--color-ready-bg)' : 'var(--color-bg-elevated)',
            border: `1px solid ${checkIn ? 'var(--color-ready-border)' : 'var(--color-border-strong)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: checkIn ? 'var(--color-ready)' : 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)',
            fontFamily: 'var(--font-family)',
          }}
        >
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: checkIn ? 'var(--color-ready)' : 'var(--color-text-muted)',
            animation: checkIn ? 'glow-pulse 2s ease infinite' : 'none',
          }} />
          {checkIn ? formatElapsed(elapsed) : 'Check In'}
          <Clock size={12} />
        </button>

        {showWidget && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-elevated)',
            padding: 16,
            width: 220,
            zIndex: 100,
            animation: 'fadeInUp 200ms ease both',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Welcome back</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>Lucky</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: checkIn ? 'var(--color-ready)' : 'var(--color-critical)',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: '0.8125rem', color: checkIn ? 'var(--color-ready)' : 'var(--color-critical)', fontWeight: 500 }}>
                {checkIn ? 'Checked In' : 'Checked Out'}
              </span>
            </div>
            {checkIn && (
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums', marginBottom: 12 }}>
                {formatElapsed(elapsed)}
              </div>
            )}
            <button
              onClick={handleToggle}
              className={`btn ${checkIn ? 'btn-danger' : 'btn-primary'} btn-primary-glow`}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {checkIn ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
              {checkIn ? 'Check Out' : 'Check In'}
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <button className="btn btn-icon btn-ghost" style={{ position: 'relative' }}>
        <Bell size={16} />
        <span style={{
          position: 'absolute', top: 4, right: 4,
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--color-critical)',
          border: '1.5px solid var(--color-bg-surface)',
        }} />
      </button>

      {/* User avatar */}
      <div style={{
        width: 30, height: 30,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3B7BF8 0%, #30A46C 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
        cursor: 'pointer',
        flexShrink: 0,
      }}>
        L
      </div>
    </header>
  )
}
