import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPayruns } from '../api/payruns'
import { useAuth } from '../context/AuthContext'
import PayrunWizardModal from '../components/PayrunWizardModal'
import { DollarSign, Plus, ChevronRight, Layers, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function Payruns() {
  const { activeRole, hasPermission } = useAuth()
  const [payruns, setPayruns] = useState([])
  const [loading, setLoading] = useState(true)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const navigate = useNavigate()

  const isPayrollAuthorized =
    ['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL'].includes((activeRole || '').toUpperCase()) ||
    hasPermission('payroll:manage') ||
    hasPermission('payroll:view:all')

  useEffect(() => {
    if (isPayrollAuthorized) {
      loadPayruns()
    } else {
      setLoading(false)
    }
  }, [activeRole, isPayrollAuthorized])

  const loadPayruns = async () => {
    setLoading(true)
    try {
      const data = await getPayruns()
      setPayruns(data || [])
    } catch (err) {
      console.error('Failed to load payruns:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleWizardSuccess = (newPayrun) => {
    setIsWizardOpen(false)
    navigate(`/payruns/${newPayrun.id}/process`)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      case 'COMPUTED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'VALIDATED':
      case 'PAID':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600'
    }
  }

  if (!isPayrollAuthorized) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center glass-panel border border-red-500/30 rounded-2xl space-y-4 my-12">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white">Payroll Access Restricted</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Your current persona/role (<strong className="text-red-400 font-mono">{activeRole}</strong>) is restricted from accessing payroll calculation and batch execution workflows.
        </p>
        <p className="text-[11px] text-slate-400">
          Only authorized roles (<strong>HR_PAYROLL_USER</strong>, <strong>HR_PAYROLL_MANAGER</strong>, and <strong>ADMIN</strong>) can execute payruns. Please use the persona switcher in the top bar to switch roles.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            <span>Payroll Batches & Payruns (Module B5)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Launch payrun wizard, compute batch salary rules, and process itemized payslips
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Payrun Batch</span>
        </button>
      </div>

      {/* Payruns List Table */}
      <div className="overflow-hidden rounded-2xl glass-panel border border-slate-800 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Payrun Batch Name</th>
              <th className="px-4 py-3">Pay Period</th>
              <th className="px-4 py-3">Assigned Structure</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {payruns.map((pr) => (
              <tr
                key={pr.id}
                onClick={() => navigate(`/payruns/${pr.id}/process`)}
                className="hover:bg-slate-900/40 cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3 font-bold text-white group-hover:text-brand-300">
                  {pr.name || `Payrun #${pr.id}`}
                </td>
                <td className="px-4 py-3 font-mono">
                  {pr.period_start} → {pr.period_end}
                </td>
                <td className="px-4 py-3 text-brand-300">Regular Monthly Structure</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(pr.status)}`}>
                    {pr.status || 'DRAFT'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="flex items-center space-x-1 ml-auto px-3 py-1 rounded-lg bg-brand-600/30 hover:bg-brand-600 text-white font-semibold text-xs border border-brand-500/30">
                    <span>Process Batch</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wizard Modal */}
      <PayrunWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleWizardSuccess}
      />
    </div>
  )
}
