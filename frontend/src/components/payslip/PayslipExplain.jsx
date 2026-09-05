/**
 * PayslipExplain — Prompt 5
 * "Why did this change?" expandable diff panel.
 * - Collapsed by default, toggled via chevron button
 * - Chevron rotates 180° on expand (CSS transform transition, not swapped icon)
 * - Height transition: grid-template-rows 0fr → 1fr (no layout snap, unlike height:auto)
 * - Shows per-line-item delta: previous vs current period
 * - Summary count-up: "Net change: +₹3,620"
 */

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

/* ── Count-up for the net change summary ───────────────────────────────────── */
function useCountUp(target, duration = 600, active = false) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    if (!active) { setDisplay(0); return }
    const startTime = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(target * eased))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
      else setDisplay(target)
    }
    raf.current = requestAnimationFrame(tick)
    return () => raf.current && cancelAnimationFrame(raf.current)
  }, [target, duration, active])

  return display
}

/* ── Money formatter ────────────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(n ?? 0))

/* ── Delta row ──────────────────────────────────────────────────────────────── */
function DeltaRow({ label, prev, curr }) {
  const delta    = (curr ?? 0) - (prev ?? 0)
  const isPos    = delta >= 0
  const color    = delta === 0
    ? 'var(--color-text-muted)'
    : isPos
      ? 'var(--color-ready)'
      : 'var(--color-deduction-text)'
  const sign     = delta > 0 ? '+' : delta < 0 ? '−' : '±'
  const ariaSign = delta > 0 ? 'increased by' : delta < 0 ? 'decreased by' : 'unchanged'

  return (
    <tr>
      <td style={{ padding: '10px 0', fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
        {label}
      </td>
      <td style={{ padding: '10px 0', textAlign: 'center', fontSize: '0.775rem', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(prev)}
      </td>
      <td style={{ padding: '10px 0', textAlign: 'center', fontSize: '0.775rem', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(curr)}
      </td>
      <td
        style={{ padding: '10px 0', textAlign: 'right', fontSize: '0.825rem', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}
        aria-label={`${label} ${ariaSign} ${fmt(Math.abs(delta))}`}
        data-money
      >
        <span aria-hidden="true">{sign} </span>{fmt(Math.abs(delta))}
      </td>
    </tr>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function PayslipExplain({ current, previous }) {
  /*
   * current / previous:  payslip objects from PayrunProcessing
   * Both have: basic_pay, allowances, gross, deductions, net_pay, breakdown(JSON)
   */

  const [open, setOpen]         = useState(false)
  const [hasOpened, setHasOpened] = useState(false)

  const handleToggle = () => {
    setOpen(o => !o)
    if (!hasOpened) setHasOpened(true)
  }

  const netDelta    = (current?.net_pay ?? 0) - (previous?.net_pay ?? 0)
  const animatedDelta = useCountUp(Math.abs(Math.round(netDelta)), 600, open)

  /* parse breakdowns */
  const parseBd = (ps) => {
    if (!ps?.breakdown) return {}
    try { return typeof ps.breakdown === 'string' ? JSON.parse(ps.breakdown) : ps.breakdown }
    catch { return {} }
  }
  const currBd = parseBd(current)
  const prevBd = parseBd(previous)

  const hasPrevious = !!previous

  const rows = [
    { label: 'Basic Pay',           curr: current?.basic_pay,                  prev: previous?.basic_pay },
    { label: 'Housing Allowance',   curr: currBd['2_Housing_Allowance'],       prev: prevBd['2_Housing_Allowance'] },
    { label: 'Transport Allowance', curr: currBd['2_Transport_Allowance'],     prev: prevBd['2_Transport_Allowance'] },
    { label: 'Gross Earnings',      curr: current?.gross,                      prev: previous?.gross },
    { label: 'LOP Deduction',       curr: currBd['4_LOP_Deduction'],           prev: prevBd['4_LOP_Deduction'] },
    { label: 'Income Tax',          curr: currBd['5_Income_Tax'],              prev: prevBd['5_Income_Tax'] },
    { label: 'Social Security',     curr: currBd['6_Social_Security'],         prev: prevBd['6_Social_Security'] },
    { label: 'Net Pay',             curr: current?.net_pay,                    prev: previous?.net_pay },
  ]

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* ── Toggle button ── */}
      <button
        id="payslip-explain-toggle"
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls="payslip-explain-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          background: 'none',
          border: 'none',
          color: 'var(--color-accent)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          cursor: 'pointer',
          padding: 'var(--space-2) 0',
          transition: 'color var(--transition-fast)',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-hover)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-accent)'}
      >
        Why did this change?
        <ChevronDown
          size={14}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: `transform var(--transition-smooth)`,
          }}
          aria-hidden="true"
        />
      </button>

      {/* ── Expand panel using grid-template-rows trick (smooth, no snap) ── */}
      <div
        id="payslip-explain-panel"
        role="region"
        aria-labelledby="payslip-explain-toggle"
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: `grid-template-rows var(--transition-smooth)`,
          overflow: 'hidden',
        }}
      >
        <div style={{ minHeight: 0 }}>
          <div className="ps-card" style={{ marginTop: 'var(--space-2)', overflow: 'hidden' }}>

            {/* ── No previous data state ── */}
            {!hasPrevious ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.825rem' }}>
                No previous period data available for comparison.
              </div>
            ) : (
              <>
                {/* ── Column headers ── */}
                <div style={{
                  padding: 'var(--space-3) var(--space-6)',
                  borderBottom: '1px solid var(--color-border)',
                  background: 'var(--color-bg-elevated)',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left',   font: 'var(--font-label)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', padding: 0 }}>Item</th>
                        <th style={{ textAlign: 'center', font: 'var(--font-label)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', padding: 0 }}>Previous</th>
                        <th style={{ textAlign: 'center', font: 'var(--font-label)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', padding: 0 }}>Current</th>
                        <th style={{ textAlign: 'right',  font: 'var(--font-label)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', padding: 0 }}>Delta</th>
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* ── Delta rows ── */}
                <div style={{ padding: '0 var(--space-6)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <caption className="sr-only">Payslip changes from previous period</caption>
                    <tbody>
                      {rows.map(r => (
                        <DeltaRow key={r.label} label={r.label} curr={r.curr} prev={r.prev} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Summary sentence ── */}
                <div style={{
                  padding: 'var(--space-4) var(--space-6)',
                  borderTop: '1px solid var(--color-border)',
                  background: 'var(--color-bg-elevated)',
                  textAlign: 'right',
                }}>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: netDelta >= 0 ? 'var(--color-ready)' : 'var(--color-deduction-text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                    aria-label={`Net change: ${netDelta >= 0 ? 'increase' : 'decrease'} of ${fmt(Math.abs(netDelta))}`}
                    data-money
                  >
                    Net change: {netDelta >= 0 ? '+' : '−'}
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(animatedDelta)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
