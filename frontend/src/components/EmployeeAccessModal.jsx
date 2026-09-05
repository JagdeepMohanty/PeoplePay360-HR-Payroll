import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Shield, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react'

export default function EmployeeAccessModal({ isOpen, onClose }) {
  const { loginWithEmployeeId, loading } = useAuth()
  const [employeeIdInput, setEmployeeIdInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleAccessSubmit = async (e) => {
    e?.preventDefault()
    if (!employeeIdInput.trim()) {
      setErrorMsg('Please enter a valid Employee ID.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      await loginWithEmployeeId(employeeIdInput)
      setEmployeeIdInput('')
      if (onClose) onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Unable to verify Employee ID. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChipClick = (id) => {
    setEmployeeIdInput(id)
    setErrorMsg('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            PeoplePay360
          </h2>
          <p className="text-xs text-brand-400 font-semibold tracking-wide uppercase">
            Employee-ID Access Control
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleAccessSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="employee-id-input" className="block text-xs font-semibold text-slate-300">
              Enter Employee ID
            </label>
            <div className="relative">
              <input
                id="employee-id-input"
                type="text"
                value={employeeIdInput}
                onChange={(e) => setEmployeeIdInput(e.target.value.toUpperCase())}
                placeholder="e.g. EMP001, HR001, PAY001"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 uppercase transition-all"
                disabled={submitting || loading}
                autoFocus
              />
              {employeeIdInput && (
                <div className="absolute right-3 top-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loading || !employeeIdInput.trim()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-brand-600/25 hover:from-brand-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
          >
            <span>{submitting ? 'Verifying...' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Test ID Quick Chips */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Test Personas:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleChipClick('EMP001')}
              className="px-2.5 py-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 text-left transition-all group"
            >
              <div className="text-[11px] font-bold text-amber-300 font-mono">EMP001</div>
              <div className="text-[10px] text-slate-400 group-hover:text-slate-300">Employee</div>
            </button>

            <button
              type="button"
              onClick={() => handleChipClick('HR001')}
              className="px-2.5 py-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 text-left transition-all group"
            >
              <div className="text-[11px] font-bold text-blue-300 font-mono">HR001</div>
              <div className="text-[10px] text-slate-400 group-hover:text-slate-300">HR Manager</div>
            </button>

            <button
              type="button"
              onClick={() => handleChipClick('PAY001')}
              className="px-2.5 py-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
            >
              <div className="text-[11px] font-bold text-emerald-300 font-mono">PAY001</div>
              <div className="text-[10px] text-slate-400 group-hover:text-slate-300">HR Payroll</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
