import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPayruns } from '../api/payruns'
import { useAuth } from '../context/AuthContext'
import PayrunWizardModal from '../components/PayrunWizardModal'
import { DollarSign, Plus, ChevronRight, Layers, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function Payruns() {
  const { activeRole } = useAuth()
  const [payruns, setPayruns] = useState([])
  const [loading, setLoading] = useState(true)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const navigate = useNavigate()

  const isPayrollAuthorized = ['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'].includes(activeRole)

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
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return 'bg-amber-50 text-amber-700'
      case 'COMPUTED':
        return 'bg-blue-50 text-blue-700'
      case 'VALIDATED':
        return 'bg-purple-50 text-[#714b67]'
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700'
      default:
        return 'bg-slate-100 text-slate-600'
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <span>Payruns & Batch Payroll</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Launch payrun wizard, compute batch salary rules, inspect warnings, and disburse payslips
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#714b67] hover:bg-[#5e3d55] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer border-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Payrun Batch</span>
        </button>
      </div>

      {/* Payruns List Table */}
      <div className="bg-white rounded-2xl shadow-xs border-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium animate-pulse">
            Loading payrun batches...
          </div>
        ) : payruns.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No payrun batches generated yet. Click &ldquo;Create Payrun Batch&rdquo; to launch the workflow wizard.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Payrun Batch</th>
                  <th className="px-6 py-3.5">Pay Period</th>
                  <th className="px-6 py-3.5">Assigned Structure</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payruns.map((pr) => (
                  <tr
                    key={pr.id}
                    onClick={() => navigate(`/payruns/${pr.id}/process`)}
                    className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-[#714b67] transition-colors">
                      {pr.name || `Payrun Batch #${pr.id}`}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500">
                      {pr.period_start} → {pr.period_end}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      Regular Monthly Structure
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusBadge(pr.status)}`}>
                        {pr.status || 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-50 group-hover:bg-[#714b67] group-hover:text-white text-slate-700 font-semibold text-xs transition-colors cursor-pointer border-0">
                        <span>Process Batch</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
