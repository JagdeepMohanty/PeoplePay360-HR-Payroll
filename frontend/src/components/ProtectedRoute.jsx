import { Navigate } from 'react'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ProtectedRoute({ permission, children }) {
  const { hasPermission, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 md:p-8 rounded-2xl glass-panel border border-rose-500/30 text-center space-y-4 shadow-2xl">
        <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-extrabold text-white tracking-tight">Access Restricted</h3>
        <p className="text-sm text-slate-300">
          You do not have permission to access this section.
        </p>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-500 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    )
  }

  return children
}
