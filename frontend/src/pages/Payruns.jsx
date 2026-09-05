import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '../api/client'
import PayrunWizardModal from '../components/PayrunWizardModal'
import { Plus } from 'lucide-react'

export default function Payruns() {
  const [showWizard, setShowWizard] = useState(false)
  const { data = [], isLoading } = useQuery({
    queryKey: ['payruns'],
    queryFn: () => client.get('/payruns').then(r => r.data),
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Payruns</h1>
        <button onClick={() => setShowWizard(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
          <Plus size={15} /> New Payrun
        </button>
      </div>

      {isLoading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {['ID', 'Period Start', 'Period End', 'Department', 'State', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(pr => (
                <tr key={pr.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{pr.id}</td>
                  <td className="px-4 py-3">{pr.period_start}</td>
                  <td className="px-4 py-3">{pr.period_end}</td>
                  <td className="px-4 py-3 text-gray-500">{pr.department || 'All'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      pr.state === 'confirmed' ? 'bg-green-100 text-green-700' :
                      pr.state === 'computed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{pr.state}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/payruns/${pr.id}/process`} className="text-blue-600 hover:underline text-xs">Process →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showWizard && <PayrunWizardModal onClose={() => setShowWizard(false)} />}
    </div>
  )
}
