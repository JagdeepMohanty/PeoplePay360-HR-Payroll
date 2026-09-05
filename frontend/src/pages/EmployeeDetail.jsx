import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { getEmployees } from '../api/employees'
import {
  ArrowLeft, Calendar, Clock, FileText, Mail, Phone,
  Building2, User, MapPin, Briefcase
} from 'lucide-react'

const avatarColors = [
  ['#3B7BF8','#1a2744'],['#30A46C','#0f2e1e'],['#F5A623','#2e200a'],
  ['#E5484D','#2e0f10'],['#7C3AED','#1e1040'],['#0EA5E9','#0a1e2e'],
]
function getInitials(name=''){return name.split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()).join('')}
function getColor(name=''){return avatarColors[name.charCodeAt(0)%avatarColors.length]}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{value}</div>
      </div>
    </div>
  )
}

function SmartBtn({ icon: Icon, label, count }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      transition: 'all var(--transition-fast)',
      textAlign: 'center',
      minWidth: 80,
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--color-border-accent)';e.currentTarget.style.background='var(--color-bg-hover)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--color-border)';e.currentTarget.style.background='var(--color-bg-elevated)'}}
    >
      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>{count ?? '—'}</div>
      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Icon size={10} /> {label}
      </div>
    </div>
  )
}

export default function EmployeeDetail() {
  const { id } = useParams()
  const { data: employees = [], isLoading } = useQuery({ queryKey: ['employees'], queryFn: getEmployees })
  const emp = employees.find(e => String(e.id) === String(id))

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 8 }} />
      <div className="pp-card" style={{ padding: 24, display: 'flex', gap: 20 }}>
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 22, width: '40%', marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 14, width: '25%' }} />
        </div>
      </div>
    </div>
  )

  if (!emp) return (
    <div style={{ textAlign: 'center', padding: 64 }}>
      <User size={48} style={{ margin: '0 auto 12px', color: 'var(--color-text-muted)', opacity: 0.4 }} />
      <p style={{ color: 'var(--color-text-muted)' }}>Employee not found</p>
      <Link to="/employees" className="btn btn-secondary" style={{ marginTop: 16 }}>← Back to Employees</Link>
    </div>
  )

  const [fg, bg] = getColor(emp.name)

  return (
    <div>
      {/* Back link */}
      <Link to="/employees" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: 18, transition: 'color var(--transition-fast)' }}
        onMouseEnter={e=>e.currentTarget.style.color='var(--color-text-primary)'}
        onMouseLeave={e=>e.currentTarget.style.color='var(--color-text-secondary)'}
      >
        <ArrowLeft size={14} /> Employees
      </Link>

      {/* Profile header card */}
      <div className="pp-card animate-fadeInUp" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: bg, border: `3px solid ${fg}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: 700, color: fg, flexShrink: 0,
          }}>
            {getInitials(emp.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{emp.name}</h1>
              <span className="status-badge status-active">Active</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              {emp.job_title && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}><Briefcase size={12} />{emp.job_title}</span>}
              {emp.department && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}><Building2 size={12} />{emp.department}</span>}
              {emp.email && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}><Mail size={12} />{emp.email}</span>}
            </div>
          </div>
          {/* Smart buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <SmartBtn icon={Calendar} label="Time Off" count={emp.time_off_count ?? 5} />
            <SmartBtn icon={FileText} label="Contracts" count={emp.contract_count ?? 1} />
            <SmartBtn icon={Clock} label="Attendance" count={emp.attendance_count ?? 22} />
          </div>
        </div>
      </div>

      {/* Two-column detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Work Information */}
        <div className="pp-card animate-fadeInUp delay-75" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 14 }}>Work Information</div>
          <InfoRow icon={Building2} label="Department" value={emp.department} />
          <InfoRow icon={Briefcase} label="Job Position" value={emp.job_title} />
          <InfoRow icon={Mail} label="Work Email" value={emp.email} />
          <InfoRow icon={User} label="Manager" value={emp.manager ?? 'Aarav Mehta'} />
          <InfoRow icon={Clock} label="Working Schedule" value={emp.schedule ?? '40 Hours / Week'} />
          <InfoRow icon={MapPin} label="Work Location" value={emp.location ?? 'Mumbai HQ'} />
        </div>

        {/* Private Information */}
        <div className="pp-card animate-fadeInUp delay-150" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 14 }}>Private Information</div>
          <InfoRow icon={Phone} label="Mobile" value={emp.phone ?? '+91 98765 43210'} />
          <InfoRow icon={MapPin} label="Home Address" value={emp.address ?? 'Mumbai, Maharashtra'} />
          <InfoRow icon={User} label="Emergency Contact" value={emp.emergency_contact ?? 'Priya Mehta · +91 98765 00000'} />
          <InfoRow icon={FileText} label="Bank Account" value={emp.bank_account ? '••••' + emp.bank_account.slice(-4) : '•••• 4321'} />
          <InfoRow icon={Calendar} label="Date of Joining" value={emp.date_start ?? '01 Jan 2023'} />
          <InfoRow icon={FileText} label="PAN Number" value={emp.pan ?? 'ABCDE1234F'} />
        </div>
      </div>
    </div>
  )
}
