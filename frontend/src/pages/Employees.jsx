import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getEmployees } from '../api/employees'
import { Search, Plus, Grid3X3, List, Users, Briefcase, Mail, Building2 } from 'lucide-react'

/* Avatar color palette */
const avatarColors = [
  ['#3B7BF8', '#1a2744'],
  ['#30A46C', '#0f2e1e'],
  ['#F5A623', '#2e200a'],
  ['#E5484D', '#2e0f10'],
  ['#7C3AED', '#1e1040'],
  ['#0EA5E9', '#0a1e2e'],
]

function getInitials(name = '') {
  return name.split(' ').slice(0,2).map(w => w[0]?.toUpperCase()).join('')
}
function getColor(name = '') {
  const idx = name.charCodeAt(0) % avatarColors.length
  return avatarColors[idx]
}

/* ── Kanban card ── */
function EmpCard({ emp }) {
  const [fg, bg] = getColor(emp.name)
  return (
    <Link to={`/employees/${emp.id}`} style={{ textDecoration: 'none' }}>
      <div className="pp-card animate-fadeInUp" style={{
        padding: 18, cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--color-border-accent)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.transform = ''
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: bg, border: `2px solid ${fg}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 700, color: fg, flexShrink: 0,
          }}>
            {getInitials(emp.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {emp.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{emp.job_title || 'Employee'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            <Building2 size={11} style={{ flexShrink: 0 }} /> {emp.department || 'N/A'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--color-text-secondary)', overflow: 'hidden' }}>
            <Mail size={11} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="status-badge status-active">Active</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-accent)', fontWeight: 500 }}>View →</span>
        </div>
      </div>
    </Link>
  )
}

export default function Employees() {
  const [view, setView] = useState('kanban')
  const [search, setSearch] = useState('')

  const { data = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    retry: 1,
  })

  const filtered = data.filter(e =>
    !search ||
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{data.length} total employees</p>
        </div>
        <button className="btn btn-primary btn-primary-glow">
          <Plus size={14} /> Add Employee
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '7px 12px',
          flex: '0 0 300px',
        }}>
          <Search size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employees, email, department…"
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: '0.875rem', width: '100%', fontFamily: 'var(--font-family)' }}
          />
        </div>
        <select className="pp-select" style={{ width: 160 }}>
          <option>All Departments</option>
          <option>HR</option><option>Sales</option><option>IT</option><option>Finance</option><option>Support</option>
        </select>
        <div style={{ flex: 1 }} />
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
          {[['kanban', Grid3X3], ['list', List]].map(([v, Icon]) => (
            <button key={v} onClick={() => setView(v)} className={`btn btn-icon btn-sm ${view === v ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 3 }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="pp-card" style={{ padding: 18, height: 140 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, marginBottom: 6, width: '70%' }} />
                  <div className="skeleton" style={{ height: 11, width: '50%' }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: 11, marginBottom: 5 }} />
              <div className="skeleton" style={{ height: 11, width: '80%' }} />
            </div>
          ))}
        </div>
      ) : view === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>
              <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No employees found</p>
            </div>
          ) : filtered.map((emp, i) => <EmpCard key={emp.id} emp={emp} style={{ animationDelay: `${i * 40}ms` }} />)}
        </div>
      ) : (
        <div className="pp-card" style={{ overflow: 'hidden' }}>
          <table className="pp-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Work Email</th>
                <th>Job Position</th>
                <th>Department</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => {
                const [fg, bg] = getColor(emp.name)
                return (
                  <tr key={emp.id}>
                    <td className="td-primary">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: bg, border: `1.5px solid ${fg}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: fg, flexShrink: 0 }}>
                          {getInitials(emp.name)}
                        </div>
                        {emp.name}
                      </div>
                    </td>
                    <td>{emp.email}</td>
                    <td>{emp.job_title || '—'}</td>
                    <td>{emp.department || '—'}</td>
                    <td><span className="status-badge status-active">Active</span></td>
                    <td>
                      <Link to={`/employees/${emp.id}`} className="btn btn-ghost btn-sm">View →</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
