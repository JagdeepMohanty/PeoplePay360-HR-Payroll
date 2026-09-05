/**
 * PayslipBreakdown — Prompt 4
 * Receipt-style vertical payslip card.
 * - Semantic <table> for line items (accessible, styled to not look like a spreadsheet)
 * - Additions (+): Basic, Housing, Transport → Gross subtotal row
 * - Deductions (−): LOP, Income Tax, Social Security → Deductions subtotal row
 * - Net Pay: largest, boldest element, with count-up animation on change
 * - Count-up uses requestAnimationFrame, 600ms, on prevNetPay → netPay change
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { AlertCircle, RefreshCw, FileText } from 'lucide-react'

/* ── Count-up hook ──────────────────────────────────────────────────────────── */
function useCountUp(target, duration = 600) {
  const [display, setDisplay] = useState(target)
  const prev = useRef(target)
  const raf  = useRef(null)

  useEffect(() => {
    if (prev.current === target) return
    const start     = prev.current
    const delta     = target - start
    const startTime = performance.now()

    const tick = (now) => {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + delta * eased))
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick)
      } else {
        setDisplay(target)
        prev.current = target
      }
    }

    raf.current = requestAnimationFrame(tick)
    return () => raf.current && cancelAnimationFrame(raf.current)
  }, [target, duration])

  return display
}

/* ── Skeleton ───────────────────────────────────────────────────────────────── */
function PayslipSkeleton() {
  return (
    <div className="ps-card" style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Header skeleton */}
        <div style={{ height: 20, width: '60%', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-elevated)', animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ height: 14, width: '40%', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-elevated)', animation: 'pulse 1.5s ease infinite' }} />
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-2) 0' }} />
        {/* Row skeletons */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ height: 12, width: `${40 + i * 5}%`, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-elevated)', animation: 'pulse 1.5s ease infinite' }} />
            <div style={{ height: 12, width: '20%',  borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-elevated)', animation: 'pulse 1.5s ease infinite' }} />
          </div>
        ))}
        {/* Net pay skeleton */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-2) 0' }} />
        <div style={{ height: 36, width: '50%', alignSelf: 'flex-end', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-elevated)', animation: 'pulse 1.5s ease infinite' }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
    </div>
  )
}

/* ── Money formatter ────────────────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0)

/* ── Line item row ──────────────────────────────────────────────────────────── */
function LineRow({ label, amount, prefix, color, bold, large, dividerAbove, ariaLabel }) {
  const style = {
    display: 'table-row',
  }
  const tdBase = {
    padding: 'var(--space-2) 0',
    borderTop: dividerAbove ? '1px solid var(--color-border)' : 'none',
    color: color || 'var(--color-text-primary)',
    fontWeight: bold ? 600 : 400,
    fontSize: large ? '1.5rem' : '0.875rem',
    fontVariantNumeric: 'tabular-nums',
  }

  return (
    <tr style={style}>
      <td style={{ ...tdBase, color: bold ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
        {label}
      </td>
      <td
        style={{ ...tdBase, textAlign: 'right', letterSpacing: large ? '-0.02em' : 0 }}
        aria-label={ariaLabel}
        data-money
      >
        <span style={{ color: prefix === '−' ? 'var(--color-deduction-text)' : (bold ? 'var(--color-text-primary)' : 'var(--color-text-secondary)') }}>
          {prefix && <span aria-hidden="true" style={{ marginRight: 2, opacity: 0.7 }}>{prefix}</span>}
          {fmt(amount)}
        </span>
      </td>
    </tr>
  )
}

/* ── Subtotal divider row ───────────────────────────────────────────────────── */
function SubtotalRow({ label, amount, color }) {
  return (
    <tr>
      <td style={{
        padding: 'var(--space-2) 0',
        borderTop: '1px solid var(--color-border)',
        color: color || 'var(--color-text-primary)',
        fontWeight: 600, fontSize: '0.875rem'
      }}>
        {label}
      </td>
      <td style={{
        padding: 'var(--space-2) 0',
        borderTop: '1px solid var(--color-border)',
        textAlign: 'right',
        color: color || 'var(--color-text-primary)',
        fontWeight: 600, fontSize: '0.875rem',
        fontVariantNumeric: 'tabular-nums',
      }} data-money>
        {fmt(amount)}
      </td>
    </tr>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function PayslipBreakdown({ payslip, employeeName, period, onDownloadPdf }) {
  /* payslip shape:
     { id, employee_id, basic_pay, allowances, gross, deductions, net_pay, breakdown }
     breakdown is a JSON string from salary_engine.py — parsed here.
  */

  const [breakdown, setBreakdown] = useState(null)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (!payslip) return
    try {
      const bd = typeof payslip.breakdown === 'string'
        ? JSON.parse(payslip.breakdown)
        : payslip.breakdown
      setBreakdown(bd)
      setError(null)
    } catch (e) {
      setError('Could not parse payslip breakdown.')
    }
  }, [payslip])

  /* count-up on net_pay changes */
  const animatedNet = useCountUp(Math.round(payslip?.net_pay ?? 0), 600)

  if (!payslip) return <PayslipSkeleton />

  if (error) {
    return (
      <div className="ps-card" style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-6)', textAlign: 'center' }}>
        <AlertCircle size={32} style={{ color: 'var(--color-critical)', marginBottom: 'var(--space-2)' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{error}</p>
      </div>
    )
  }

  const housing   = breakdown?.['2_Housing_Allowance']   ?? 0
  const transport = breakdown?.['2_Transport_Allowance'] ?? 0
  const lop       = breakdown?.['4_LOP_Deduction']       ?? 0
  const tax       = breakdown?.['5_Income_Tax']          ?? 0
  const social    = breakdown?.['6_Social_Security']     ?? 0

  return (
    <article
      className="ps-card"
      aria-label={`Payslip for ${employeeName ?? 'Employee'}`}
      style={{ maxWidth: 480, margin: '0 auto', overflow: 'hidden' }}
    >
      {/* ── Header ── */}
      <header style={{
        padding: 'var(--space-6) var(--space-6) var(--space-4)',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ font: 'var(--font-label)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              Payslip
            </p>
            <h2 style={{ font: 'var(--font-section)', color: 'var(--color-text-primary)', margin: 0 }}>
              {employeeName ?? `Employee #${payslip.employee_id}`}
            </h2>
            {period && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                {period.start} — {period.end}
              </p>
            )}
          </div>
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              className="no-print"
              aria-label="Download payslip as PDF"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                background: 'var(--color-accent-muted)',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-info-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,123,248,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent-muted)'}
            >
              <FileText size={13} /> PDF
            </button>
          )}
        </div>
      </header>

      {/* ── Line items ── */}
      <div style={{ padding: 'var(--space-4) var(--space-6)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} role="table" aria-label="Payslip line items">
          <caption className="sr-only">Payslip earnings and deductions</caption>
          <thead className="sr-only">
            <tr><th scope="col">Item</th><th scope="col">Amount</th></tr>
          </thead>
          <tbody>
            {/* ── Additions ── */}
            <LineRow label="Basic Pay"           amount={payslip.basic_pay} prefix="+" ariaLabel={`Basic pay: ${fmt(payslip.basic_pay)}`} />
            <LineRow label="Housing Allowance"   amount={housing}   prefix="+" ariaLabel={`Housing allowance: ${fmt(housing)}`} />
            <LineRow label="Transport Allowance" amount={transport} prefix="+" ariaLabel={`Transport allowance: ${fmt(transport)}`} />

            {/* ── Gross subtotal ── */}
            <SubtotalRow label="Gross Earnings" amount={payslip.gross} />

            {/* ── Deductions ── */}
            {lop > 0 && (
              <LineRow label="Loss of Pay (LOP)" amount={lop} prefix="−"
                ariaLabel={`Loss of pay deduction: ${fmt(lop)}`} />
            )}
            <LineRow label="Income Tax (7%)"   amount={tax}    prefix="−" ariaLabel={`Income tax: ${fmt(tax)}`} />
            <LineRow label="Social Security (3%)" amount={social} prefix="−" ariaLabel={`Social security: ${fmt(social)}`} />

            {/* ── Deductions subtotal ── */}
            <SubtotalRow label="Total Deductions" amount={payslip.deductions} color="var(--color-deduction-text)" />
          </tbody>
        </table>
      </div>

      {/* ── Net Pay — the hero number ── */}
      <footer style={{
        padding: 'var(--space-4) var(--space-6) var(--space-6)',
        borderTop: '2px solid var(--color-border-strong)',
        background: 'var(--color-bg-elevated)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ font: 'var(--font-label)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 4 }}>
            Net Pay
          </p>
          <p style={{ font: 'var(--font-label)', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
            Take-home this period
          </p>
        </div>
        <div
          aria-label={`Net pay: ${fmt(payslip.net_pay)}`}
          data-money
          style={{
            font: 'var(--font-card-metric)',
            fontSize: '2.25rem',
            color: 'var(--color-ready)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
          }}
        >
          {/* Animated count-up */}
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(animatedNet)}
        </div>
      </footer>
    </article>
  )
}
