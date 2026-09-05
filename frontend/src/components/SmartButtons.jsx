import { useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { FileText, Clock, Umbrella } from 'lucide-react'
import client from '../api/client'

const fetchCount = (path) => () =>
  client.get(path).then((r) => (Array.isArray(r.data) ? r.data.length : 0))

export default function SmartButtons({ employeeId }) {
  const navigate = useNavigate()

  const [contractsQ, attendanceQ, leavesQ] = useQueries({
    queries: [
      { queryKey: ['contracts', 'count', employeeId], queryFn: fetchCount(`/contracts?employee_id=${employeeId}`), enabled: !!employeeId },
      { queryKey: ['attendance', 'count', employeeId], queryFn: fetchCount(`/attendance?employee_id=${employeeId}`), enabled: !!employeeId },
      { queryKey: ['leaves',    'count', employeeId], queryFn: fetchCount(`/leaves?employee_id=${employeeId}`),    enabled: !!employeeId },
    ],
  })

  const buttons = [
    {
      label: 'Contracts',
      icon: FileText,
      path: `/contracts?employee_id=${employeeId}`,
      count: contractsQ.data,
      loading: contractsQ.isLoading,
    },
    {
      label: 'Attendance',
      icon: Clock,
      path: `/attendance?employee_id=${employeeId}`,
      count: attendanceQ.data,
      loading: attendanceQ.isLoading,
    },
    {
      label: 'Time Off',
      icon: Umbrella,
      path: `/time-off?employee_id=${employeeId}`,
      count: leavesQ.data,
      loading: leavesQ.isLoading,
    },
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {buttons.map(({ label, icon: Icon, path, count, loading }) => (
        <button
          key={label}
          onClick={() => navigate(path)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Icon size={13} />
          {label}
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
            loading
              ? 'bg-gray-100 text-gray-400'
              : count > 0
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-500'
          }`}>
            {loading ? '…' : count ?? 0}
          </span>
        </button>
      ))}
    </div>
  )
}
