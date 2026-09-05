import React from 'react'
import { Umbrella, CheckCircle, Clock, Calendar } from 'lucide-react'

export default function TimeOffOverviewPanel({ data }) {
  const timeOff = data || {
    approved_days: 14.5,
    pending_requests: 3,
    leave_balance_days: 124.0,
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Umbrella className="text-purple-600" size={18} />
          <h3 className="text-sm font-bold text-gray-900">Time-Off & Leave Metrics</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-purple-50/60 border border-purple-100 p-3.5 rounded-lg">
          <p className="text-purple-700 font-medium flex items-center gap-1"><CheckCircle size={12} /> Approved Days</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{timeOff.approved_days} Days</p>
        </div>

        <div className="bg-amber-50/60 border border-amber-100 p-3.5 rounded-lg">
          <p className="text-amber-700 font-medium flex items-center gap-1"><Clock size={12} /> Pending Approvals</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{timeOff.pending_requests} Requests</p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-lg">
          <p className="text-emerald-700 font-medium flex items-center gap-1"><Calendar size={12} /> Total Leave Balance</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{timeOff.leave_balance_days} Days</p>
        </div>
      </div>
    </div>
  )
}
