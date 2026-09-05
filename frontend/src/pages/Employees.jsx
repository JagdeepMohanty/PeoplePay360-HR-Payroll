import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getEmployees } from '../api/employees'

export default function Employees() {
  const { data = [], isLoading } = useQuery({ queryKey: ['employees'], queryFn: getEmployees })

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Employees</h1>
      {isLoading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {['Name', 'Department', 'Job Title', 'Email', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.department}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.job_title}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.email}</td>
                  <td className="px-4 py-3">
                    <Link to={`/employees/${emp.id}`} className="text-blue-600 hover:underline text-xs">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
