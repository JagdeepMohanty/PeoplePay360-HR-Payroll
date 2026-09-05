import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Clock, CheckCircle2, XCircle, AlertTriangle, Filter } from 'lucide-react'
import client from '../api/client'

const mockAttendance = [
  { id: 1, employee: 'Aarav Mehta', check_in: '2026-09-05 09:02', check_out: '2026-09-05 18:05', worked_hours: 9.05, overtime: 0.05, status: 'present' },
  { id: 2, employee: 'Maya Shah', check_in: '2026-09-05 09:45', check_out: '2026-09-05 18:00', worked_hours: 8.25, overtime: 0, status: 'late' },
  { id: 3, employee: 'Rohan Patel', check_in: '2026-09-05 09:00', check_out: '2026-09-05 19:30', worked_hours: 10.5, overtime: 1.5, status: 'present' },
  { id: 4, employee: 'Nisha Rao', check_in: null, check_out: null, worked_hours: 0, overtime: 0, status: 'absent' },
  { id: 5, employee: 'Vikram Singh', check_in: '2026-09-05 08:55', check_out: '2026-09-05 17:58', worked_hours: 9.05, overtime: 0.05, status: 'present' },
  { id: 6, employee: 'Deepa Nair', check_in: '2026-09-05 10:20', check_out: '2026-09-05 18:00', worked_hours: 7.67, overtime: 0, status: 'late' },
]

const statusIcon = {
  present: <CheckCircle2 size={13} style={{ color: 'var(--color-ready)' }} />,
  late: <AlertTriangle size={13} style={{ color: 'var(--color-warning)' }} />,
  absent: <XCircle size={13} style={{ color: 'var(--color-critical)' }} />,
}
const statusBadge = { present: 'status-approved', late: 'status-to-approve', absent: 'status-inactive' }

function fmtHours(h) {
  if (!h) return '—'
  const hr = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  return `${hr}h ${min}m`
}

export default function Attendance() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const { data = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => client.get('/attendance').then(r => r.data).catch(() => mockAttendance),
    retry: 1,
  })

  const rows = (data.length ? data : mockAttendance).filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (search && !r.employee?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    present: rows.filter(r => r.status === 'present').length,
    late: rows.filter(r => r.status === 'late').length,
    absent: rows.filter(r => r.status === 'absent').length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Today · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary"><Filter size={13} /> Filter</button>
        </div>
      </div>

      {/* Quick stat chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'all', label: `All · ${(data.length || mockAttendance.length)}`, cls: 'chip-pending' },
          { key: 'present', label: `Present · ${counts.present}`, cls: 'chip-ready' },
          { key: 'late', label: `Late · ${counts.late}`, cls: 'chip-warning' },
          { key: 'absent', label: `Absent · ${counts.absent}`, cls: 'chip-critical' },
        ].map(({ key, label, cls }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`chip ${filter === key ? cls : 'chip-pending'}`}
            style={{ cursor: 'pointer', border: filter === key ? undefined : '1px solid var(--color-border)', background: filter === key ? undefined : 'transparent', color: filter === key ? undefined : 'var(--color-text-secondary)' }}
          >
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '5px 10px' }}>
          <Search size={13} style={{ color: 'var(--color-text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…" style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-family)', width: 180 }} />
        </div>
      </div>

      {/* Table */}
      <div className="pp-card" style={{ overflow: 'hidden' }}>
        <table className="pp-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Worked Hours</th>
              <th>Overtime</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td className="td-primary">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-accent-muted)', border: '1px solid var(--color-border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-accent)', flexShrink: 0 }}>
                      {row.employee?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    {row.employee}
                  </div>
                </td>
                <td>
                  {row.check_in ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontVariantNumeric: 'tabular-nums' }}>
                      <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
                      {row.check_in.split(' ')[1]}
                    </span>
                  ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                </td>
                <td>
                  {row.check_out ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontVariantNumeric: 'tabular-nums' }}>
                      <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
                      {row.check_out.split(' ')[1]}
                    </span>
                  ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {fmtHours(row.worked_hours)}
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums', color: row.overtime > 0 ? 'var(--color-ready)' : 'var(--color-text-muted)' }}>
                  {row.overtime > 0 ? `+${fmtHours(row.overtime)}` : '—'}
                </td>
                <td>
                  <span className={`status-badge ${statusBadge[row.status]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {statusIcon[row.status]}
                    {row.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm">Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
