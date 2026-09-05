import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { Plus, Search, Filter, ArrowRight, Calendar } from 'lucide-react'

const stateOrder = { draft: 0, computed: 1, validated: 2, confirmed: 3 }
const stateLabel = { draft: 'Draft', computed: 'Computed', validated: 'Validated', confirmed: 'Confirmed (Paid)' }
const stateBadge = { draft: 'status-draft', computed: 'status-computed', validated: 'status-validated', confirmed: 'status-confirmed' }

function PayrunWizardModal({ onClose }) {
  const [step, setStep] = useState(1)
  const qc = useQueryClient()
  const [form, setForm] = useState({ structure: '', period_start: '', period_end: '', department: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    setLoading(true); setError('')
    try {
      await client.post('/payruns', form)
      await qc.invalidateQueries({ queryKey: ['payruns'] })
      onClose()
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to create payrun')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: 520 }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>New Pay Run</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Step {step} of 2</div>
          </div>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ width: 24, height: 4, borderRadius: 2, background: s <= step ? 'var(--color-accent)' : 'var(--color-bg-hover)' }} />
            ))}
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Step 1 — Salary Structure &amp; Period</div>
              <div>
                <label className="pp-label">Salary Structure Type</label>
                <select className="pp-select" value={form.structure} onChange={e => set('structure', e.target.value)}>
                  <option value="">Select structure…</option>
                  <option value="monthly">Monthly Employee</option>
                  <option value="hourly">Hourly Contractor</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="pp-label">Period Start</label>
                  <input type="date" className="pp-input" value={form.period_start} onChange={e => set('period_start', e.target.value)} />
                </div>
                <div>
                  <label className="pp-label">Period End</label>
                  <input type="date" className="pp-input" value={form.period_end} onChange={e => set('period_end', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="pp-label">Department (optional)</label>
                <select className="pp-select" value={form.department} onChange={e => set('department', e.target.value)}>
                  <option value="">All Departments</option>
                  <option>HR</option><option>Sales</option><option>IT</option><option>Finance</option><option>Support</option>
                </select>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Step 2 — Select Employees</div>
              <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employee</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Aarav Mehta', wage: '₹50,000' }, { name: 'Maya Shah', wage: '₹65,000' },
                      { name: 'Vikram Singh', wage: '₹55,000' }, { name: 'Deepa Nair', wage: '₹48,000' },
                    ].map(emp => (
                      <tr key={emp.name} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '9px 12px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-accent)' }} />
                            {emp.name}
                          </label>
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-secondary)' }}>{emp.wage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--color-critical-bg)', border: '1px solid var(--color-critical-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: 'var(--color-critical)' }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {step === 2 && <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {step === 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!form.structure || !form.period_start || !form.period_end}>
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button className="btn btn-primary btn-primary-glow" onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating…' : 'Create Pay Run'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Payruns() {
  const [showWizard, setShowWizard] = useState(false)
  const [search, setSearch] = useState('')

  const { data = [], isLoading } = useQuery({
    queryKey: ['payruns'],
    queryFn: () => client.get('/payruns').then(r => r.data).catch(() => mockPayruns),
    retry: 1,
  })

  const rows = data.length ? data : mockPayruns
  const filtered = rows.filter(r => !search || r.period_start?.includes(search) || r.department?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pay Runs</h1>
          <p className="page-subtitle">{rows.length} pay runs · {rows.filter(r => r.state === 'confirmed').length} confirmed</p>
        </div>
        <button className="btn btn-primary btn-primary-glow" onClick={() => setShowWizard(true)}>
          <Plus size={14} /> New Pay Run
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', flex: '0 0 280px' }}>
          <Search size={13} style={{ color: 'var(--color-text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by period or department…" style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-family)', width: '100%' }} />
        </div>
        <select className="pp-select" style={{ width: 160 }}>
          <option value="">All Statuses</option>
          <option>Draft</option><option>Computed</option><option>Validated</option><option>Confirmed</option>
        </select>
        <button className="btn btn-secondary"><Filter size={13} /> Filter</button>
      </div>

      <div className="pp-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 24 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div className="skeleton" style={{ flex: 1, height: 14 }} />
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
                <th>Pay Run ID</th>
                <th>Period Start</th>
                <th>Period End</th>
                <th>Department</th>
                <th>Employees</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(pr => (
                <tr key={pr.id}>
                  <td className="td-primary">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      #{String(pr.id).padStart(4, '0')}
                    </div>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{pr.period_start}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{pr.period_end}</td>
                  <td>{pr.department || <span style={{ color: 'var(--color-text-muted)' }}>All Depts</span>}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{pr.employee_count ?? '—'}</td>
                  <td>
                    <span className={`status-badge ${stateBadge[pr.state] || 'status-draft'}`}>
                      {stateLabel[pr.state] || pr.state}
                    </span>
                  </td>
                  <td>
                    <Link to={`/payruns/${pr.id}/process`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                      Process →
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No pay runs found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showWizard && <PayrunWizardModal onClose={() => setShowWizard(false)} />}
    </div>
  )
}

const mockPayruns = [
  { id: 1, period_start: '2026-09-01', period_end: '2026-09-30', department: 'All', state: 'draft', employee_count: 48 },
  { id: 2, period_start: '2026-08-01', period_end: '2026-08-31', department: 'IT', state: 'confirmed', employee_count: 24 },
  { id: 3, period_start: '2026-08-01', period_end: '2026-08-31', department: 'Sales', state: 'validated', employee_count: 18 },
  { id: 4, period_start: '2026-07-01', period_end: '2026-07-31', department: 'All', state: 'confirmed', employee_count: 46 },
]
