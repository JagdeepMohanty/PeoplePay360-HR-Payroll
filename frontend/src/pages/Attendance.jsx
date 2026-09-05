import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Clock, CheckCircle2, AlertCircle, XCircle,
  Calendar, Download, UserCheck
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import client from '../api/client'

const mockAttendance = [
  { id: 1, employee: 'Aarav Sharma', department: 'Engineering', date: '2026-09-05', check_in: '09:02 AM', check_out: '06:15 PM', worked_hours: '8h 45m', overtime: '0h 45m', status: 'Present' },
  { id: 2, employee: 'Priya Patel', department: 'HR', date: '2026-09-05', check_in: '09:42 AM', check_out: '06:00 PM', worked_hours: '7h 48m', overtime: '-', status: 'Late' },
  { id: 3, employee: 'Rohan Verma', department: 'Sales', date: '2026-09-05', check_in: '08:55 AM', check_out: '05:30 PM', worked_hours: '8h 35m', overtime: '-', status: 'Present' },
  { id: 4, employee: 'Ananya Iyer', department: 'Engineering', date: '2026-09-05', check_in: '09:00 AM', check_out: '06:30 PM', worked_hours: '9h 00m', overtime: '1h 00m', status: 'Present' },
  { id: 5, employee: 'Vikram Singh', department: 'Operations', date: '2026-09-05', check_in: '-', check_out: '-', worked_hours: '0h', overtime: '-', status: 'On Leave' },
  { id: 6, employee: 'Sneha Reddy', department: 'Marketing', date: '2026-09-05', check_in: '10:15 AM', check_out: '07:00 PM', worked_hours: '8h 15m', overtime: '-', status: 'Late' },
  { id: 7, employee: 'Kabir Das', department: 'Engineering', date: '2026-09-05', check_in: '-', check_out: '-', worked_hours: '0h', overtime: '-', status: 'Absent' },
]

export default function Attendance() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      try {
        const res = await client.get('/api/v1/attendance')
        return res?.data?.length ? res.data : mockAttendance
      } catch {
        return mockAttendance
      }
    },
    initialData: mockAttendance,
  })

  const records = attendanceData || mockAttendance

  const filtered = records.filter((rec) => {
    const matchesSearch =
      rec.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.department?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = [
    { label: 'Present Today', count: records.filter((r) => r.status === 'Present').length, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Late Arrivals', count: records.filter((r) => r.status === 'Late').length, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'On Leave', count: records.filter((r) => r.status === 'On Leave').length, color: 'text-sky-700', bg: 'bg-sky-50' },
    { label: 'Absent', count: records.filter((r) => r.status === 'Absent').length, color: 'text-rose-700', bg: 'bg-rose-50' },
  ]

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return <Badge variant="success">Present</Badge>
      case 'Late':
        return <Badge variant="warning">Late</Badge>
      case 'On Leave':
        return <Badge variant="info">On Leave</Badge>
      case 'Absent':
        return <Badge variant="danger">Absent</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar (0 Outlines) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Attendance & Shifts</h1>
          <p className="text-xs text-slate-500">Live biometric punch-in logs and overtime tracking.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 shadow-xs">
          <Download className="h-3.5 w-3.5" /> Export Attendance
        </Button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500">{s.label}</span>
                <div className={`text-xl font-bold tabular-nums ${s.color}`}>
                  {s.count}
                </div>
              </div>
              <div className={`p-2 rounded-xl ${s.bg}`}>
                <UserCheck className={`h-4 w-4 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee or department..."
            className="pl-8 h-8 text-xs bg-white shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['All', 'Present', 'Late', 'On Leave', 'Absent'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-[#714b67] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 shadow-xs'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Worked Hours</TableHead>
              <TableHead>Overtime</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((rec) => (
              <TableRow key={rec.id}>
                <TableCell className="font-semibold text-slate-900">{rec.employee}</TableCell>
                <TableCell className="text-slate-500 text-xs">{rec.department}</TableCell>
                <TableCell className="text-xs font-mono text-slate-700">{rec.check_in}</TableCell>
                <TableCell className="text-xs font-mono text-slate-700">{rec.check_out}</TableCell>
                <TableCell className="text-xs font-mono font-medium text-slate-900">
                  {rec.worked_hours}
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-500">
                  {rec.overtime}
                </TableCell>
                <TableCell className="text-right">
                  {getStatusBadge(rec.status)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
