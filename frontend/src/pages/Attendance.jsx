import { useState } from 'react'
import {
  Search, Clock, CheckCircle2, AlertCircle, XCircle,
  Calendar, Download, UserCheck, Plus, LogIn, LogOut
} from 'lucide-react'
import { usePayroll } from '@/context/PayrollContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'

export default function Attendance() {
  const { attendance, employees, punchIn, punchOut, addManualAttendance, permissions } = usePayroll()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)

  // Manual Attendance Form State (B3)
  const [manualForm, setManualForm] = useState({
    employee: employees[0]?.name || 'Aarav Sharma',
    department: employees[0]?.department || 'Engineering',
    date: new Date().toISOString().split('T')[0],
    check_in: '09:00 AM',
    check_out: '06:00 PM',
    worked_hours: '8h 00m',
    overtime: '0h 00m',
    status: 'Present',
    notes: '',
  })

  const filtered = attendance.filter((rec) => {
    const matchesSearch =
      rec.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.department?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = [
    { label: 'Present Today', count: attendance.filter((r) => r.status === 'Present').length, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Late Arrivals', count: attendance.filter((r) => r.status === 'Late').length, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'On Leave', count: attendance.filter((r) => r.status === 'On Leave').length, color: 'text-sky-700', bg: 'bg-sky-50' },
    { label: 'Absent', count: attendance.filter((r) => r.status === 'Absent').length, color: 'text-rose-700', bg: 'bg-rose-50' },
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

  const handleManualSubmit = (e) => {
    e.preventDefault()
    addManualAttendance(manualForm)
    setIsManualModalOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar (0 Outlines) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Attendance & Shifts</h1>
          <p className="text-xs text-slate-500">Live biometric punch-in logs and overtime tracking.</p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canManageHR && (
            <Button
              onClick={() => setIsManualModalOpen(true)}
              className="gap-1.5 font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Manual Correction
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 shadow-xs">
            <Download className="h-3.5 w-3.5" /> Export Logs
          </Button>
        </div>
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

      {/* Attendance Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Date</TableHead>
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
                <TableCell className="text-xs font-mono text-slate-600">{rec.date}</TableCell>
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

      {/* Manual Correction Form Dialog (B3) */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Attendance Correction</DialogTitle>
            <DialogDescription>
              Record an authorized punch correction or missing shift entry for an employee.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualSubmit} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Select Employee</label>
              <select
                value={manualForm.employee}
                onChange={(e) => {
                  const emp = employees.find(emp => emp.name === e.target.value)
                  setManualForm({
                    ...manualForm,
                    employee: e.target.value,
                    department: emp?.department || 'Engineering'
                  })
                }}
                className="flex h-8 w-full rounded-lg border-0 bg-slate-100/90 px-2.5 py-1 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#714b67]/25"
              >
                {employees.map(e => (
                  <option key={e.id} value={e.name}>{e.name} ({e.department})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Date</label>
                <Input
                  type="date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  className="h-8 text-xs bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Status</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="flex h-8 w-full rounded-lg border-0 bg-slate-100/90 px-2.5 py-1 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#714b67]/25"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Check In Time</label>
                <Input
                  value={manualForm.check_in}
                  onChange={(e) => setManualForm({ ...manualForm, check_in: e.target.value })}
                  className="h-8 text-xs bg-slate-50 font-mono"
                  placeholder="09:00 AM"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Check Out Time</label>
                <Input
                  value={manualForm.check_out}
                  onChange={(e) => setManualForm({ ...manualForm, check_out: e.target.value })}
                  className="h-8 text-xs bg-slate-50 font-mono"
                  placeholder="06:00 PM"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Reason / Correction Note</label>
              <Input
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                placeholder="e.g. Biometric terminal offline at gate 2"
                className="h-8 text-xs bg-slate-50"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsManualModalOpen(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-7 text-xs">
                Save Attendance Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
