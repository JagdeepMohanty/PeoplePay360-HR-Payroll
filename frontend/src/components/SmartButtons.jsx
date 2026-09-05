import { useNavigate } from 'react-router-dom'
import { FileText, Clock, Umbrella } from 'lucide-react'

export default function SmartButtons({ employeeId }) {
  const navigate = useNavigate()
  const buttons = [
    { label: 'Contracts', icon: FileText, path: `/contracts?employee=${employeeId}` },
    { label: 'Attendance', icon: Clock, path: `/attendance?employee=${employeeId}` },
    { label: 'Time Off', icon: Umbrella, path: `/time-off?employee=${employeeId}` },
  ]
  return (
    <div className="flex gap-2">
      {buttons.map(({ label, icon: Icon, path }) => (
        <button
          key={label}
          onClick={() => navigate(path)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  )
}
