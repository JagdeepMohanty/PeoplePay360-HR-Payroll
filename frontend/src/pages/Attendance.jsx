import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Clock, CheckCircle2, AlertCircle, XCircle,
  Calendar, Download, UserCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    { label: 'Present Today', count: records.filter((r) => r.status === 'Present').length, color: 'text-emerald-400' },
    { label: 'Late Arrivals', count: records.filter((r) => r.status === 'Late').length, color: 'text-amber-400' },
    { label: 'On Leave', count: records.filter((r) => r.status === 'On Leave').length, color: 'text-blue-400' },
    { label: 'Absent', count: records.filter((r) => r.status === 'Absent').length, color: 'text-rose-400' },
  ]

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return <Badge variant="success" className="text-[10px]">Present</Badge>
      case 'Late':
        return <Badge variant="warning" className="text-[10px]">Late</Badge>
      case 'On Leave':
        return <Badge variant="info" className="text-[10px]">On Leave</Badge>
      case 'Absent':
        return <Badge variant="danger" className="text-[10px]">Absent</Badge>
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance & Biometrics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time biometric logs, late check-in records, and shift calculations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Download className="h-3.5 w-3.5" /> Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <div className={`text-2xl font-bold tabular-nums ${s.color}`}>
                  {s.count}
                </div>
              </div>
              <UserCheck className={`h-6 w-6 opacity-20 ${s.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/60 p-3 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by employee or dept..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['All', 'Present', 'Late', 'On Leave', 'Absent'].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className={`text-xs h-8 px-3 rounded-lg ${
                statusFilter === st ? 'bg-primary/15 text-primary border border-primary/20' : ''
              }`}
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
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
                <TableCell className="font-medium text-foreground">{rec.employee}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{rec.department}</TableCell>
                <TableCell className="text-xs font-mono">{rec.check_in}</TableCell>
                <TableCell className="text-xs font-mono">{rec.check_out}</TableCell>
                <TableCell className="text-xs font-mono font-medium text-foreground">
                  {rec.worked_hours}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
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
