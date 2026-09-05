import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, Clock, Umbrella,
  DollarSign, Settings, ChevronRight, Shield
} from 'lucide-react'

const navSections = [
  {
    label: 'Main',
    links: [
      { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    ],
  },
  {
    label: 'HR',
    links: [
      { to: '/employees',  label: 'Employees',  icon: Users },
      { to: '/contracts',  label: 'Contracts',  icon: FileText },
      { to: '/attendance', label: 'Attendance', icon: Clock },
      { to: '/time-off',   label: 'Time Off',   icon: Umbrella },
    ],
  },
  {
    label: 'Payroll',
    links: [
      { to: '/payruns',    label: 'Pay Runs',   icon: DollarSign },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: 'var(--color-sidebar-bg)',
      borderRight: '1px solid var(--color-sidebar-border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 10,
    }}>
      {/* Logo / Brand */}
      <div style={{
        padding: '18px 16px 16px',
        borderBottom: '1px solid var(--color-sidebar-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--color-accent)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Shield size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
            PeoplePay360
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            HR &amp; Payroll
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {navSections.map(section => (
          <div key={section.label} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: '0.625rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 8px',
              marginBottom: 6,
            }}>
              {section.label}
            </div>
            {section.links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                style={{ marginBottom: 2 }}
              >
                <Icon size={15} style={{ flexShrink: 0, opacity: 0.8 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {/* Active indicator chevron */}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid var(--color-sidebar-border)',
      }}>
        <div className="sidebar-link" style={{ cursor: 'default' }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B7BF8 0%, #30A46C 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6875rem', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            L
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Lucky
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Payroll Admin</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
