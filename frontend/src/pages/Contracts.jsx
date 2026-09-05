import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, FileText, Calendar, DollarSign } from 'lucide-react'
import client from '../api/client'

const statusClass = {
  running: 'status-running', confirmed: 'status-confirmed',
  draft: 'status-draft', expired: 'status-expired',
}

export default function Contracts() {
  const [search, setSearch] = useState('')

  const { data = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => client.get('/contracts').then(r => r.data).catch(() => mockContracts),
    retry: 1,
  })

  const filtered = data.filter(c =>
    !search || c.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contracts</h1>
          <p className="page-subtitle">{data.length} contracts · {data.filter(c => c.state === 'running').length} running</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={14} /> New Contract
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', flex: '0 0 300px' }}>
          <Search size={13} style={{ color: 'var(--color-text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contracts or employees…" style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: '0.875rem', width: '100%', fontFamily: 'var(--font-family)' }} />
        </div>
        <select className="pp-select" style={{ width: 160 }}>
          <option value="">All Statuses</option>
          <option>Running</option><option>Draft</option><option>Expired</option>
        </select>
      </div>

      <div className="pp-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 20 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div className="skeleton" style={{ flex: 2, height: 14 }} />
                <div className="skeleton" style={{ flex: 2, height: 14 }} />
                <div className="skeleton" style={{ flex: 1, height: 14 }} />
                <div className="skeleton" style={{ flex: 1, height: 14 }} />
                <div className="skeleton" style={{ flex: 1, height: 20, borderRadius: 99 }} />
              </div>
            ))}
          </div>
        ) : (
          <table className="pp-table">
            <thead>
              <tr>
                <th>Contract Ref</th>
                <th>Employee</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th style={{ textAlign: 'right' }}>Wage / Month</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="td-primary">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <FileText size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      {c.name || `CON/${c.id}`}
                    </div>
                  </td>
                  <td className="td-primary">{c.employee_name}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={12} style={{ color: 'var(--color-text-muted)' }} />
                      {c.date_start || '—'}
                    </span>
                  </td>
                  <td>{c.date_end || <span style={{ color: 'var(--color-text-muted)' }}>Ongoing</span>}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                      <DollarSign size={12} style={{ color: 'var(--color-text-muted)' }} />
                      ₹{Number(c.wage || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${statusClass[c.state] || 'status-draft'}`}>
                      {c.state || 'draft'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm">View →</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                    No contracts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const mockContracts = [
  { id: 1, name: 'CON/2026/0042', employee_name: 'Aarav Mehta', date_start: '01 Jan 2024', date_end: null, wage: 50000, state: 'running' },
  { id: 2, name: 'CON/2026/0031', employee_name: 'Maya Shah', date_start: '01 Mar 2024', date_end: null, wage: 65000, state: 'running' },
  { id: 3, name: 'CON/2026/0019', employee_name: 'Rohan Patel', date_start: '15 Jul 2023', date_end: '14 Jul 2026', wage: 42000, state: 'expired' },
  { id: 4, name: 'CON/2026/0055', employee_name: 'Nisha Rao', date_start: '01 Sep 2026', date_end: null, wage: 78000, state: 'draft' },
  { id: 5, name: 'CON/2026/0047', employee_name: 'Vikram Singh', date_start: '01 Jun 2024', date_end: null, wage: 55000, state: 'running' },
]
