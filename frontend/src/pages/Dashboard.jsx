import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Area, AreaChart
} from 'recharts'
import {
  Users, DollarSign, TrendingUp, Calendar,
  Clock, AlertTriangle, CheckCircle, ArrowUpRight,
  ArrowDownRight, Shield, Activity
} from 'lucide-react'
import { getDashboard } from '../api/dashboard'

/* ── animated count-up hook ── */
function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    if (target === undefined || target === null) return
    const start = Date.now()
    const from = 0
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(from + (target - from) * ease))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return val
}

/* ── KPI Card ── */
function KpiCard({ label, value, prefix = '', suffix = '', trend, trendLabel, color = 'var(--color-accent)', icon: Icon, loading }) {
  const displayVal = useCountUp(loading ? 0 : (value ?? 0))
  return (
    <div className="pp-card animate-fadeInUp" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: 'var(--radius-sm)',
          background: `${color}20`,
          border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {Icon && <Icon size={16} style={{ color }} />}
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: '0.6875rem', fontWeight: 600,
            color: trend >= 0 ? 'var(--color-ready)' : 'var(--color-critical)',
          }}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {loading ? (
        <>
          <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 12, width: '40%' }} />
        </>
      ) : (
        <>
          <div style={{
            fontSize: '1.75rem', fontWeight: 700,
            color: 'var(--color-text-primary)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1, marginBottom: 4,
          }}>
            {prefix}{typeof value === 'number' ? displayVal.toLocaleString('en-IN') : value}{suffix}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {label}
            {trendLabel && (
              <span style={{ marginLeft: 4, color: 'var(--color-text-muted)' }}>{trendLabel}</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Custom Tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border-strong)',
      borderRadius: 'var(--radius-sm)',
      padding: '8px 12px',
      fontSize: '0.8125rem',
    }}>
      <div style={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: '0.75rem' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, color: p.fill || p.stroke || 'var(--color-text-primary)', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill || p.stroke, display: 'inline-block' }} />
          {p.name}: ₹{p.value?.toLocaleString('en-IN')}
        </div>
      ))}
    </div>
  )
}

/* ── Payroll Alerts strip ── */
const alerts = [
  { label: 'Missing bank accounts', count: 3, sev: 'critical' },
  { label: 'Duplicate payslips', count: 1, sev: 'critical' },
  { label: 'Unvalidated drafts', count: 5, sev: 'warning' },
  { label: 'Expiring contracts', count: 2, sev: 'warning' },
]

/* ── Mock monthly trend data ── */
const trendData = [
  { month: 'Apr', net: 910000 },
  { month: 'May', net: 940000 },
  { month: 'Jun', net: 920000 },
  { month: 'Jul', net: 985000 },
  { month: 'Aug', net: 1040000 },
  { month: 'Sep', net: 1020000 },
]

export default function Dashboard() {
  const [dept, setDept] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', dept],
    queryFn: () => getDashboard({ dept }),
    retry: 1,
  })

  const chartData = data
    ? Object.entries(data.by_department || {}).map(([name, v]) => ({
        name: name.length > 8 ? name.slice(0, 8) : name,
        Gross: v.gross,
        Net: v.net,
      }))
    : [
        { name: 'HR', Gross: 420000, Net: 380000 },
        { name: 'Sales', Gross: 680000, Net: 610000 },
        { name: 'Support', Gross: 310000, Net: 285000 },
        { name: 'Finance', Gross: 510000, Net: 460000 },
        { name: 'IT', Gross: 740000, Net: 670000 },
      ]

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll Dashboard</h1>
          <p className="page-subtitle">OXP Pvt Ltd · September 2026</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="pp-select" style={{ width: 180 }} value={dept} onChange={e => setDept(e.target.value)}>
            <option value="">All Departments</option>
            <option value="HR">HR</option>
            <option value="Sales">Sales</option>
            <option value="Finance">Finance</option>
            <option value="IT">IT</option>
            <option value="Support">Support</option>
          </select>
          <select className="pp-select" style={{ width: 160 }}>
            <option>All Employee Types</option>
            <option>Full-time</option>
            <option>Contractor</option>
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 22 }}>
        <KpiCard loading={isLoading} label="Total Net Salary Paid" value={data?.total_net ?? 1020000} prefix="₹" trend={4.2} trendLabel="vs last month" icon={DollarSign} color="var(--color-accent)" />
        <KpiCard loading={isLoading} label="Payslips Generated" value={148} suffix="" trend={null} trendLabel="142 paid · 6 pending" icon={Activity} color="var(--color-ready)" />
        <KpiCard loading={isLoading} label="Avg Salary / Employee" value={12432} prefix="₹" trend={1.8} icon={TrendingUp} color="var(--color-info)" />
        <KpiCard loading={isLoading} label="Approved Time Off" value={34} suffix=" Days" icon={Calendar} color="var(--color-warning)" />
        <KpiCard loading={isLoading} label="Attendance Health" value={94} suffix="%" trend={-0.5} icon={Clock} color="var(--color-ready)" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 22 }}>
        {/* Bar chart */}
        <div className="pp-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Net Salary Cost by Department</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Gross vs Net comparison</div>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#3B7BF8', display: 'inline-block' }} /> Gross
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#30A46C', display: 'inline-block' }} /> Net
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={48} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="Gross" fill="#3B7BF8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Net" fill="#30A46C" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend line */}
        <div className="pp-card" style={{ padding: '18px 20px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Monthly Net Salary Trend</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Apr – Sep 2026</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B7BF8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B7BF8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={48} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />
              <Area type="monotone" dataKey="net" stroke="#3B7BF8" strokeWidth={2} fill="url(#netGrad)" name="Net" dot={{ fill: '#3B7BF8', r: 3 }} activeDot={{ r: 5, fill: '#3B7BF8' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: Alerts + Payslip Status + Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Payroll Alerts */}
        <div className="pp-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Payroll Alerts</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>Action required</div>

          {/* Status bar */}
          <div style={{ display: 'flex', gap: 2, height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ flex: 142, background: 'var(--color-ready)', opacity: 0.7 }} />
            <div style={{ flex: 3, background: 'var(--color-critical)' }} />
            <div style={{ flex: 1, background: 'var(--color-critical)', opacity: 0.6 }} />
            <div style={{ flex: 5, background: 'var(--color-warning)', opacity: 0.8 }} />
            <div style={{ flex: 2, background: 'var(--color-warning)', opacity: 0.5 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { label: 'Paid', count: 142, sev: 'ready' },
              { label: 'Pending', count: 6, sev: 'warning' },
            ].map(({ label, count, sev }) => (
              <span key={label} className={`chip chip-${sev}`}>{count} {label}</span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map(({ label, count, sev }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px',
                background: `var(--color-${sev}-bg)`,
                border: `1px solid var(--color-${sev}-border)`,
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <AlertTriangle size={12} style={{ color: `var(--color-${sev})`, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{label}</span>
                </div>
                <span className={`chip chip-${sev}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Overview Table */}
        <div className="pp-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Department Overview</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>Headcount &amp; monthly payroll</div>
          <table className="pp-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Headcount</th>
                <th style={{ textAlign: 'right' }}>Net Payroll</th>
              </tr>
            </thead>
            <tbody>
              {[
                { dept: 'IT', count: 24, net: 670000 },
                { dept: 'Sales', count: 18, net: 610000 },
                { dept: 'Finance', count: 12, net: 460000 },
                { dept: 'HR', count: 10, net: 380000 },
                { dept: 'Support', count: 8, net: 285000 },
              ].map(row => (
                <tr key={row.dept}>
                  <td className="td-primary">{row.dept}</td>
                  <td>{row.count}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    ₹{row.net.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
