/**
 * ExceptionCard — Prompt 6
 * Payroll exception card with severity left-bar, Fix Now / Ignore actions.
 *
 * Fix Now flow:
 *   1. Inline spinner replaces label, card gets processing treatment (dim + top progress bar)
 *   2. On success: card fades/collapses (~300ms), inline toast confirmation appears
 *   3. Fires custom browser event `payroll_guardian_updated` with new risk delta
 *   4. On failure: restores card + shows inline error, user can retry
 *
 * Design:
 *   - Left-edge severity bar (4–6px) + uppercase chip — never color-only
 *   - Financial impact figure is the emotional hook — rendered prominently
 *   - Fix Now = filled primary (high visual weight)
 *   - Ignore = ghost/text only (clearly secondary — dismissal is not recommended)
 */

import { useState, useRef } from 'react'
import { Loader2, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react'

/* ── Severity config ────────────────────────────────────────────────────────── */
const SEVERITY = {
  critical: {
    barClass:  'severity-bar-critical',
    chipClass: 'chip chip-critical',
    icon:      <XCircle size={11} aria-hidden="true" />,
    label:     'Critical',
    color:     'var(--color-critical)',
  },
  warning: {
    barClass:  'severity-bar-warning',
    chipClass: 'chip chip-warning',
    icon:      <AlertTriangle size={11} aria-hidden="true" />,
    label:     'Warning',
    color:     'var(--color-warning)',
  },
  info: {
    barClass:  'severity-bar-info',
    chipClass: 'chip chip-info',
    icon:      <Info size={11} aria-hidden="true" />,
    label:     'Info',
    color:     'var(--color-info)',
  },
}

/* ── Money formatter ────────────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0)

/* ── Toast ──────────────────────────────────────────────────────────────────── */
function InlineToast({ message }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--color-ready-bg)',
        border: '1px solid var(--color-ready-border)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-ready)',
        fontSize: '0.825rem', fontWeight: 500,
        animation: 'fadeInUp 250ms ease forwards',
      }}
    >
      <CheckCircle2 size={14} aria-hidden="true" />
      {message}
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function ExceptionCard({
  exceptionId,
  severity = 'warning',
  employeeName,
  exceptionType,
  financialImpact,
  description,
  onFixNow,      // async fn(exceptionId) → { success, delta, message }
  onIgnore,      // fn(exceptionId)
}) {
  const [state, setState]       = useState('idle')    // idle | fixing | resolved | failed
  const [errorMsg, setErrorMsg] = useState(null)
  const [resolvedMsg, setResolvedMsg] = useState(null)
  const cardRef = useRef(null)

  const sev = SEVERITY[severity] ?? SEVERITY.warning

  /* ── Fix Now handler ── */
  const handleFixNow = async () => {
    setState('fixing')
    setErrorMsg(null)
    try {
      const result = await (onFixNow ? onFixNow(exceptionId) : Promise.resolve({ success: true, delta: -financialImpact, message: 'Issue resolved — payroll recalculated' }))

      if (result?.success === false) throw new Error(result?.message ?? 'Fix failed')

      setResolvedMsg(result?.message ?? '✓ Resolved — payroll recalculated')
      setState('resolved')

      /* Fire bus event so dashboard risk ring can react */
      window.dispatchEvent(new CustomEvent('payroll_guardian_updated', {
        detail: { exceptionId, delta: result?.delta ?? 0 },
        bubbles: true,
      }))

    } catch (e) {
      setState('failed')
      setErrorMsg(e.message ?? 'Something went wrong. Please retry.')
    }
  }

  const handleIgnore = () => {
    onIgnore?.(exceptionId)
  }

  /* ── Resolved state — show toast, card already fading via CSS ── */
  if (state === 'resolved') {
    return (
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <InlineToast message={resolvedMsg} />
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  const isFixing    = state === 'fixing'
  const isFailed    = state === 'failed'
  const cardOpacity = isFixing ? 0.6 : 1

  return (
    <article
      ref={cardRef}
      className={`ps-card ${sev.barClass} ${isFixing ? 'processing-bar' : ''}`}
      aria-label={`${sev.label} exception: ${exceptionType} for ${employeeName}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 'var(--space-4)',
        opacity: cardOpacity,
        transition: `opacity var(--transition-smooth)`,
      }}
    >
      {/* ── Card body ── */}
      <div style={{ padding: 'var(--space-4) var(--space-6)' }}>

        {/* ── Top row: chip + employee name ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <span className={sev.chipClass} aria-label={`Severity: ${sev.label}`}>
            {sev.icon} {sev.label}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {employeeName}
          </span>
        </div>

        {/* ── Exception type ── */}
        <h3 style={{
          font: 'var(--font-section)',
          color: 'var(--color-text-primary)',
          margin: '0 0 var(--space-2)',
          fontSize: '0.9375rem',
        }}>
          {exceptionType}
        </h3>

        {/* ── Description ── */}
        {description && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-3)', lineHeight: 1.5 }}>
            {description}
          </p>
        )}

        {/* ── Financial impact — the emotional hook ── */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 6,
          padding: 'var(--space-2) var(--space-3)',
          background: sev.color === 'var(--color-critical)'
            ? 'var(--color-critical-bg)' : sev.color === 'var(--color-warning)'
            ? 'var(--color-warning-bg)' : 'var(--color-info-bg)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--space-4)',
        }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Impact
          </span>
          <span
            data-money
            aria-label={`Financial impact: ${fmt(financialImpact)} if not fixed`}
            style={{ fontSize: '1.125rem', fontWeight: 700, color: sev.color, fontVariantNumeric: 'tabular-nums' }}
          >
            {fmt(financialImpact)}
          </span>
          <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>if not fixed</span>
        </div>

        {/* ── Error message ── */}
        {isFailed && errorMsg && (
          <p role="alert" style={{
            fontSize: '0.775rem', color: 'var(--color-critical)',
            marginBottom: 'var(--space-3)',
            padding: '6px 10px',
            background: 'var(--color-critical-bg)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-critical-border)',
          }}>
            {errorMsg}
          </p>
        )}

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {/* Fix Now — filled primary, high visual weight */}
          <button
            id={`fix-now-${exceptionId}`}
            onClick={handleFixNow}
            disabled={isFixing}
            aria-busy={isFixing}
            aria-label={isFixing ? 'Fixing exception…' : `Fix this exception: ${exceptionType}`}
            className="btn-primary-glow"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px',
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600, fontSize: '0.825rem',
              cursor: isFixing ? 'not-allowed' : 'pointer',
              transition: `background var(--transition-fast), transform var(--transition-fast)`,
              opacity: isFixing ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!isFixing) e.currentTarget.style.background = 'var(--color-accent-hover)' }}
            onMouseLeave={e => { if (!isFixing) e.currentTarget.style.background = 'var(--color-accent)' }}
          >
            {isFixing
              ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" /> Fixing…</>
              : '⚡ Fix Now'
            }
          </button>

          {/* Ignore — ghost/text only, clearly lower visual weight */}
          <button
            id={`ignore-${exceptionId}`}
            onClick={handleIgnore}
            disabled={isFixing}
            aria-label={`Ignore exception: ${exceptionType}`}
            style={{
              padding: '8px 12px',
              background: 'none',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 400, fontSize: '0.8rem',
              cursor: isFixing ? 'not-allowed' : 'pointer',
              transition: `color var(--transition-fast), border-color var(--transition-fast)`,
            }}
            onMouseEnter={e => { if (!isFixing) { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)' } }}
            onMouseLeave={e => { if (!isFixing) { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)' } }}
          >
            Ignore
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </article>
  )
}
