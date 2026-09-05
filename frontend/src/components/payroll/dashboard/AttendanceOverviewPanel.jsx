import React from 'react'
import { Clock, UserCheck, AlertOctagon, UserX, Timer, Edit3, ShieldCheck } from 'lucide-react'

export default function AttendanceOverviewPanel({ data }) {
  const attendance = data || {
    present: 42,
    late: 4,
    absent: 2,
    overtime_hours: 38.5,
    missing_checkouts: 1,
    manual_edits: 3,
    attendance_coverage_pct: 96.4,
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="text-blue-600" size={18} />
          <h3 className="text-sm font-bold text-gray-900">Attendance & Time Tracking Overview</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {attendance.attendance_coverage_pct}% Coverage
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-lg">
          <p className="text-emerald-700 font-medium flex items-center gap-1"><UserCheck size={12} /> Present</p>
          <p className="text-xl font-bold text-emerald-900 mt-1">{attendance.present}</p>
        </div>

        <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-lg">
          <p className="text-amber-700 font-medium flex items-center gap-1"><Clock size={12} /> Late Check-ins</p>
          <p className="text-xl font-bold text-amber-900 mt-1">{attendance.late}</p>
        </div>

        <div className="bg-rose-50/60 border border-rose-100 p-3 rounded-lg">
          <p className="text-rose-700 font-medium flex items-center gap-1"><UserX size={12} /> Unexcused Absent</p>
          <p className="text-xl font-bold text-rose-900 mt-1">{attendance.absent}</p>
        </div>

        <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-lg">
          <p className="text-blue-700 font-medium flex items-center gap-1"><Timer size={12} /> Overtime Hours</p>
          <p className="text-xl font-bold text-blue-900 mt-1">{attendance.overtime_hours} hrs</p>
        </div>

        <div className="bg-purple-50/60 border border-purple-100 p-3 rounded-lg">
          <p className="text-purple-700 font-medium flex items-center gap-1"><AlertOctagon size={12} /> Missing Checkouts</p>
          <p className="text-xl font-bold text-purple-900 mt-1">{attendance.missing_checkouts}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
          <p className="text-gray-600 font-medium flex items-center gap-1"><Edit3 size={12} /> Manual Log Edits</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{attendance.manual_edits}</p>
        </div>
      </div>
    </div>
  )
}
