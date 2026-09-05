import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-base)', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Navbar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 28px',
          background: 'var(--color-bg-base)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
