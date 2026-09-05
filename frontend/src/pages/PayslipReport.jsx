/**
 * PayslipReport — Prompt 8
 * Full-page printable/downloadable payslip.
 * - Professional company letterhead area
 * - Two-column employee details block (name, ID, dept, pay period)
 * - Same breakdown table structure as PayslipBreakdown
 * - Net Pay in a bordered box — the dominant visual
 * - Compliance footer
 * - Print CSS via @media print (no interactive-only components)
 * - Download PDF button → GET /api/v1/payruns/payslips/{id}/pdf
 */

import { useParams } from 'react-router-dom'
import { useQuery }  from '@tanstack/react-query'
import { Printer, Download, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { downloadPayslipPdf } from '../api/payslips'
import client from '../api/client'

/* ── Money formatter ────────────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n ?? 0)

/* ── Table row ──────────────────────────────────────────────────────────────── */
function Row({ label, amount, prefix, muted, bold, dividerAbove }) {
  return (
    <tr style={{ borderTop: dividerAbove ? '1px solid #e2e8f0' : 'none' }}>
      <td style={{
        padding: '7px 0',
        fontSize: 13,
        color: muted ? '#64748b' : '#1e293b',
        fontWeight: bold ? 600 : 400,
      }}>
        {label}
      </td>
      <td style={{
        padding: '7px 0',
        textAlign: 'right',
        fontSize: 13,
        fontWeight: bold ? 600 : 400,
        color: prefix === '−' ? '#c0392b' : muted ? '#64748b' : '#1e293b',
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum"',
      }}>
        {prefix && <span aria-hidden="true">{prefix} </span>}
        {fmt(amount)}
      </td>
    </tr>
  )
}

/* ── Loading skeleton ───────────────────────────────────────────────────────── */
function ReportSkeleton() {
  return (
    <div style={{ maxWidth: 680, margin: '40px auto', padding: 40, background: '#fff', borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
      {[200, 140, 300, 60, 60, 60, 60, 80].map((w, i) => (
        <div key={i} style={{ height: 14, width: w, background: '#e2e8f0', borderRadius: 4, marginBottom: 12, animation: 'pulse 1.5s ease infinite' }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function PayslipReport() {
  const { id: payrunId } = useParams()
  const navigate          = useNavigate()

  /* Fetch payslips for this payrun */
  const { data: payslips = [], isLoading, isError } = useQuery({
    queryKey: ['payslips', payrunId],
    queryFn:  () => client.get(`/payruns/${payrunId}/payslips`).then(r => r.data),
    enabled:  !!payrunId,
  })

  /* Fetch payrun details for period */
  const { data: payrun } = useQuery({
    queryKey: ['payrun', payrunId],
    queryFn:  () => client.get(`/payruns`).then(r => r.data.find(p => String(p.id) === String(payrunId))),
    enabled:  !!payrunId,
  })

  const handleDownloadPdf = async (payslip) => {
    try {
      const blob = await downloadPayslipPdf(payslip.id)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `payslip_${payslip.employee_id}_${payrun?.period_start ?? payrunId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('PDF download failed. Please try again.')
    }
  }

  if (isLoading) return <ReportSkeleton />

  if (isError || payslips.length === 0) {
    return (
      <div style={{ maxWidth: 680, margin: '40px auto', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ marginBottom: 12 }}>
          {isError ? 'Failed to load payslips.' : 'No payslips found. Compute the payrun first.'}
        </p>
        <button
          onClick={() => navigate(`/payruns/${payrunId}/process`)}
          style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
        >
          ← Back to Processing
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* ── Action bar (hidden on print) ── */}
      <div className="no-print" style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 'var(--space-6)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--color-text-secondary)', cursor:'pointer', fontSize:13 }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <span style={{ flex:1, color:'var(--color-text-primary)', fontWeight:600 }}>
          Payrun #{payrunId} — Payslip Report
        </span>
        <button
          onClick={() => window.print()}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'var(--color-bg-elevated)', color:'var(--color-text-secondary)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer' }}
        >
          <Printer size={13}/> Print All
        </button>
      </div>

      {/* ── One payslip report per payslip ── */}
      {payslips.map((slip, idx) => {
        let breakdown = {}
        try { breakdown = typeof slip.breakdown === 'string' ? JSON.parse(slip.breakdown) : (slip.breakdown ?? {}) }
        catch {}

        const housing   = breakdown['2_Housing_Allowance']   ?? 0
        const transport = breakdown['2_Transport_Allowance'] ?? 0
        const lop       = breakdown['4_LOP_Deduction']       ?? 0
        const tax       = breakdown['5_Income_Tax']          ?? 0
        const social    = breakdown['6_Social_Security']     ?? 0

        return (
          <article
            key={slip.id}
            aria-label={`Payslip for employee ${slip.employee_id}`}
            style={{
              maxWidth: 680,
              margin: '0 auto var(--space-12)',
              background: '#fff',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              pageBreakAfter: 'always',
            }}
          >
            {/* ── Letterhead ── */}
            <header style={{
              background: 'linear-gradient(135deg, #0B0E14 0%, #1a2236 100%)',
              color: '#fff',
              padding: '28px 36px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <h1 style={{ font: '700 1.4rem/1.2 Inter, system-ui, sans-serif', margin: 0, letterSpacing: '-0.02em' }}>
                  PeoplePay<span style={{ color: '#3B7BF8' }}>360</span>
                </h1>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  HR &amp; Payroll Platform
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Payslip
                </p>
                <p style={{ fontSize: 13, color: '#E8ECF4', fontWeight: 500 }}>
                  {payrun?.period_start} — {payrun?.period_end}
                </p>
              </div>
            </header>

            {/* ── Employee details (two-column key-value) ── */}
            <section aria-label="Employee details" style={{ padding: '24px 36px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px' }}>
                {[
                  ['Employee',   `#${slip.employee_id}`],
                  ['Department', payrun?.department || 'All Departments'],
                  ['Pay Period', `${payrun?.period_start ?? '—'} to ${payrun?.period_end ?? '—'}`],
                  ['Status',     payrun?.state ?? '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 2 }}>{k}</dt>
                    <dd style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', margin: 0 }}>{v}</dd>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Earnings & Deductions table ── */}
            <section aria-label="Earnings and deductions" style={{ padding: '24px 36px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} role="table">
                <caption className="sr-only">Payslip earnings and deductions breakdown</caption>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', paddingBottom: 8, fontWeight: 500 }}>Item</th>
                    <th style={{ textAlign: 'right', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', paddingBottom: 8, fontWeight: 500 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <Row label="Basic Pay"              amount={slip.basic_pay}  prefix="+" />
                  <Row label="Housing Allowance"      amount={housing}         prefix="+" muted />
                  <Row label="Transport Allowance"    amount={transport}       prefix="+" muted />
                  <Row label="Gross Earnings"         amount={slip.gross}      bold dividerAbove />
                  {lop > 0 && <Row label="Loss of Pay Deduction" amount={lop} prefix="−" />}
                  <Row label="Income Tax (7%)"        amount={tax}             prefix="−" muted />
                  <Row label="Social Security (3%)"   amount={social}         prefix="−" muted />
                  <Row label="Total Deductions"       amount={slip.deductions} bold dividerAbove />
                </tbody>
              </table>
            </section>

            {/* ── Net Pay box — dominant visual ── */}
            <section
              aria-label={`Net pay: ${fmt(slip.net_pay)}`}
              style={{
                margin: '0 36px 24px',
                padding: '20px 24px',
                background: '#f0fdf4',
                border: '2px solid #86efac',
                borderRadius: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#166534', margin: 0, marginBottom: 4 }}>Net Pay</p>
                <p style={{ fontSize: 11, color: '#4ade80', margin: 0 }}>Take-home this period</p>
              </div>
              <span
                data-money
                style={{ fontSize: '2rem', fontWeight: 700, color: '#15803d', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}
              >
                {fmt(slip.net_pay)}
              </span>
            </section>

            {/* ── Compliance footer ── */}
            <footer style={{
              padding: '14px 36px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                This is a computer-generated payslip and does not require a signature.
                Generated by PeoplePay360 Payroll Guardian.
              </p>
              {/* Download PDF button — hidden on actual print */}
              <button
                className="no-print"
                onClick={() => handleDownloadPdf(slip)}
                aria-label={`Download PDF for employee ${slip.employee_id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px',
                  background: '#1e293b',
                  color: '#e8ecf4',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  transition: 'background 150ms ease',
                  flexShrink: 0,
                  marginLeft: 16,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
              >
                <Download size={11} /> PDF
              </button>
            </footer>
          </article>
        )
      })}
    </div>
  )
}
