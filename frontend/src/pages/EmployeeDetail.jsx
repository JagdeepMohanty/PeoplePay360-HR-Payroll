import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getEmployee } from '../api/employees'
import SmartButtons from '../components/SmartButtons'

export default function EmployeeDetail() {
  const { id } = useParams()
  const { data: emp, isLoading } = useQuery({ queryKey: ['employee', id], queryFn: () => getEmployee(id) })

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>
  if (!emp) return <p className="text-sm text-red-500">Employee not found.</p>

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-800 mb-1">{emp.name}</h1>
      <p className="text-sm text-gray-500 mb-4">{emp.job_title} · {emp.department}</p>

      <SmartButtons employeeId={emp.id} />

      <div className="mt-6 bg-white rounded-xl border p-5 space-y-3 text-sm">
        <Row label="Email" value={emp.email} />
        <Row label="Bank Account" value={emp.bank_account || <span className="text-red-500">Not set</span>} />
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}
