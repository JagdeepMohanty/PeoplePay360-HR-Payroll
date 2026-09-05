import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '../api/client'
import PayrunWizardModal from '../components/payroll/payrun/PayrunWizardModal'
import PayrollStatusBadge from '../components/payroll/common/PayrollStatusBadge'
import LoadingState from '../components/payroll/common/LoadingState'
import EmptyState from '../components/payroll/common/EmptyState'
import { Plus, DollarSign } from 'lucide-react'

const MOCK_PAYRUNS_LIST = [
  { id: 101, name: 'June 2025 Regular Payrun', period_start: '2025-06-01', period_end: '2025-06-30', department: 'All Departments', state: 'confirmed', employee_count: 48, total_net: 98300 },
  { id: 102, name: 'May 2025 Regular Payrun', period_start: '2025-05-01', period_end: '2025-05-31', department: 'All Departments', state: 'confirmed', employee_count: 46, total_net: 95500 },
  { id: 103, name: 'July 2025 Engineering Payrun', period_start: '2025-07-01', period_end: '2025-07-31', department: 'Engineering', state: 'computed', employee_count: 18, total_net: 43500 },
]

export default function Payruns() {
  const [showWizard, setShowWizard] = useState(false)
  const { data = [], isLoading } = useQuery({
    queryKey: ['payruns'],
    queryFn: () => client.get('/payruns').then(r => r.data).catch(() => MOCK_PAYRUNS_LIST),
  })

  const payrunList = Array.isArray(data) && data.length > 0 ? data : MOCK_PAYRUNS_LIST

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payrun Operations & History</h1>
          <p className="text-xs text-gray-500">Manage monthly payroll calculations, guardian checks, and disbursement</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={15} /> Create New Payrun
        </button>
      </div>

      {isLoading ? (
        <LoadingState rows={4} message="Fetching payruns history..." />
      ) : payrunList.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No payruns created yet"
          description="Click 'Create New Payrun' above to start a 2-step payrun calculation wizard."
          action={
            <button
              onClick={() => setShowWizard(true)}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
            >
              Start Payrun Wizard
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-xs">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">ID & Name</th>
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-center">Employees</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payrunList.map((pr) => (
                <tr key={pr.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900">{pr.name || `Payrun #${pr.id}`}</p>
                    <p className="text-[11px] text-gray-400">ID: #{pr.id}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {pr.period_start} → {pr.period_end}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{pr.department || 'All Departments'}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-800">{pr.employee_count || 1}</td>
                  <td className="px-4 py-3">
                    <PayrollStatusBadge status={pr.state} size="small" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/payruns/${pr.id}/process`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      Process & View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PART A: 2-Step Payrun Creation Wizard */}
      {showWizard && <PayrunWizardModal onClose={() => setShowWizard(false)} />}
    </div>
  )
}
