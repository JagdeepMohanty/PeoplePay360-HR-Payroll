import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Umbrella, Search, CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react'
import client from '../api/client'

const mockLeaves = [
  { id: 1, employee: 'Aarav Mehta', type: 'Paid Time Off', start: '2026-09-10', end: '2026-09-12', days: 3, status: 'approved', approver: 'HR Manager', reason: 'Personal trip' },
  { id: 2, employee: 'Maya Shah', type: 'Sick Leave', start: '2026-09-08', end: '2026-09-08', days: 1, status: 'approved', approver: 'HR Manager', reason: 'Doctor visit' },
  { id: 3, employee: 'Rohan Patel', type: 'Unpaid Leave', start: '2026-09-15', end: '2026-09-17', days: 3, status: 'to-approve', approver: 'HR Manager', reason: 'Family event' },
  { id: 4, employee: 'Nisha Rao', type: 'Paid Time Off', start: '2026-09-20', end: '2026-09-20', days: 1, status: 'refused', approver: 'HR Manager', reason: 'Festival' },
  { id: 5, employee: 'Vikram Singh', type: 'Sick Leave', start: '2026-09-06', end: '2026-09-07', days: 2, status: 'approved', approver: 'HR Manager', reason: 'Illness' },
]

const mockAllocations = [
  { id: 1, employee: 'Aarav Mehta', type: 'Paid Time Off', allocated: 21, taken: 8, remaining: 13, status: 'approved' },
  { id: 2, employee: 'Maya Shah', type: 'Sick Leave', allocated: 12, taken: 3, remaining: 9, status: 'approved' },
  { id: 3, employee: 'Rohan Patel', type: 'Paid Time Off', allocated: 21, taken: 10, remaining: 11, status: 'approved' },
]

function LeaveStatusBadge({ status }) {
  const map = { approved: 'status-approved', 'to-approve': 'status-to-approve', refused: 'status-refused' }
  return <span className={`status-badge ${map[status] || 'status-pending'}`}>{status === 'to-approve' ? 'Pending' : status}</span>
}

export default function TimeOff() {
  const [tab, setTab] = useState('requests')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)

  const rows = mockLeaves.filter(r =>
    !search || r.employee.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Time Off</h1>
          <p className="page-subtitle">Manage leave requests, allocations and types</p>
        </div>
        <button className="btn btn-primary btn-primary-glow" onClick={() => setShowNew(true)}>
          <Plus size={14} /> New Request
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
        {[
          { key: 'requests', label: 'Time Off Requests', count: mockLeaves.length },
          { key: 'allocations', label: 'Allocations', count: mockAllocations.length },
          { key: 'types', label: 'Leave Types' },
        ].map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === key ? '2px solid var(--color-accent)' : '2px solid transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-family)',
              fontSize: '0.875rem',
              fontWeight: tab === key ? 600 : 400,
              color: tab === key ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              transition: 'all var(--transition-fast)',
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: -1,
            }}
          >
            {label}
            {count !== undefined && (
              <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: 99, background: tab === key ? 'var(--color-accent-muted)' : 'var(--color-bg-elevated)', color: tab === key ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', flex: '0 0 280px' }}>
          <Search size={13} style={{ color: 'var(--color-text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees…" style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-family)', width: '100%' }} />
        </div>
        <select className="pp-select" style={{ width: 160 }}>
          <option>All Statuses</option>
          <option>Approved</option><option>Pending</option><option>Refused</option>
        </select>
      </div>

      {tab === 'requests' && (
        <div className="pp-card" style={{ overflow: 'hidden' }}>
          <table className="pp-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td className="td-primary">{row.employee}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Umbrella size={12} style={{ color: 'var(--color-text-muted)' }} />
                      {row.type}
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={12} style={{ color: 'var(--color-text-muted)' }} /> {row.start}
                    </span>
                  </td>
                  <td>{row.end}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {row.days} {row.days === 1 ? 'day' : 'days'}
                  </td>
                  <td><LeaveStatusBadge status={row.status} /></td>
                  <td>
                    {row.status === 'to-approve' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm" style={{ background: 'var(--color-ready-bg)', color: 'var(--color-ready)', border: '1px solid var(--color-ready-border)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: '0.75rem', fontFamily: 'var(--font-family)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={11} /> Approve
                        </button>
                        <button className="btn btn-sm btn-danger">
                          <XCircle size={11} /> Refuse
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm">View</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'allocations' && (
        <div className="pp-card" style={{ overflow: 'hidden' }}>
          <table className="pp-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th style={{ textAlign: 'right' }}>Allocated</th>
                <th style={{ textAlign: 'right' }}>Taken</th>
                <th style={{ textAlign: 'right' }}>Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockAllocations.map(a => (
                <tr key={a.id}>
                  <td className="td-primary">{a.employee}</td>
                  <td>{a.type}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)' }}>{a.allocated} days</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--color-warning)' }}>{a.taken} days</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--color-ready)', fontWeight: 600 }}>{a.remaining} days</td>
                  <td><span className="status-badge status-approved">Approved</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'types' && (
        <div className="pp-card" style={{ overflow: 'hidden' }}>
          <table className="pp-table">
            <thead>
              <tr>
                <th>Type Name</th>
                <th>Unit</th>
                <th>Allocation Required</th>
                <th>Approval</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Paid Time Off', unit: 'Days', alloc: 'Yes', approval: 'Manager', status: 'Active' },
                { name: 'Sick Leave', unit: 'Days', alloc: 'No', approval: 'HR Officer', status: 'Active' },
                { name: 'Unpaid Leave', unit: 'Days', alloc: 'No', approval: 'HR Manager', status: 'Active' },
                { name: 'Compensatory Off', unit: 'Days', alloc: 'Yes', approval: 'Manager', status: 'Active' },
              ].map(t => (
                <tr key={t.name}>
                  <td className="td-primary">{t.name}</td>
                  <td>{t.unit}</td>
                  <td>{t.alloc}</td>
                  <td>{t.approval}</td>
                  <td><span className="status-badge status-active">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
