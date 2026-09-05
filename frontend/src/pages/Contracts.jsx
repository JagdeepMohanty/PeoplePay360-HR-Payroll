import { useSearchParams } from 'react-router-dom'

export default function Contracts() {
  const [searchParams] = useSearchParams()
  const employeeId = searchParams.get('employee')

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-2">Contracts</h1>
      {employeeId && (
        <p className="text-xs text-blue-600 font-medium">Filtering by Employee ID: #{employeeId}</p>
      )}
    </div>
  )
}

