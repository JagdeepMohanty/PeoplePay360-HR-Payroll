import { useState } from 'react'
import {
  Umbrella, Plus, CheckCircle2, XCircle, Clock, Calendar,
  AlertTriangle, Filter, Search
} from 'lucide-react'
import { usePayroll } from '@/context/PayrollContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'

export default function TimeOff() {
  const {
    timeOffRequests,
    leaveBalances,
    createTimeOffRequest,
    approveTimeOffRequest,
    refuseTimeOffRequest,
    employees,
    permissions
  } = usePayroll()

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Leave Request Form State (B4)
  const [newRequest, setNewRequest] = useState({
    employee: employees[0]?.name || 'Aarav Sharma',
    department: employees[0]?.department || 'Engineering',
    leave_type: 'Paid Time Off (PTO)',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    days: 1,
    reason: '',
  })

  const filteredRequests = timeOffRequests.filter(
    (r) =>
      r.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.leave_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    createTimeOffRequest(newRequest)
    setIsModalOpen(false)
    setNewRequest({
      employee: employees[0]?.name || 'Aarav Sharma',
      department: employees[0]?.department || 'Engineering',
      leave_type: 'Paid Time Off (PTO)',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      days: 1,
      reason: '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Time Off Requests</h1>
          <p className="text-xs text-slate-500">Employee leave requests, approvals, and allocation balances.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 font-medium shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" /> New Leave Request
        </Button>
      </div>

      {/* Leave Balances Grid (Automatically updates when approved!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {leaveBalances.map((b) => (
          <Card key={b.type}>
            <CardContent className="p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                {b.type}
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-xl font-bold tabular-nums text-slate-900">
                  {b.remaining}{' '}
                  <span className="text-xs font-normal text-slate-500">days remaining</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {b.used}/{b.allocated} used
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-[#714b67] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (b.used / b.allocated) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requests Tabs */}
      <Tabs defaultValue="requests" className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList className="bg-slate-100 p-0.5 rounded-full border-0">
            <TabsTrigger value="requests" className="text-xs rounded-full px-4">
              Leave Requests ({filteredRequests.length})
            </TabsTrigger>
            <TabsTrigger value="policy" className="text-xs rounded-full px-4">
              Leave Policy Rules
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search requests..."
              className="pl-8 h-8 text-xs bg-white shadow-xs"
            />
          </div>
        </div>

        <TabsContent value="requests">
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-semibold text-slate-900">
                      <div>{req.employee}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{req.department}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{req.leave_type}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-600">
                      {req.start_date} → {req.end_date}
                    </TableCell>
                    <TableCell className="text-xs font-medium tabular-nums text-slate-900">
                      {req.days} days
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-[180px] truncate">
                      {req.reason}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          req.status === 'Approved'
                            ? 'success'
                            : req.status === 'Refused'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {permissions.canApproveLeave && (
                            <>
                              <Button
                                size="sm"
                                variant="teal"
                                onClick={() => approveTimeOffRequest(req.id)}
                                className="h-6 px-2.5 text-[11px] rounded-full"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => refuseTimeOffRequest(req.id)}
                                className="h-6 px-2.5 text-[11px] rounded-full"
                              >
                                Refuse
                              </Button>
                            </>
                          )}
                          {!permissions.canApproveLeave && (
                            <span className="text-xs text-amber-600 font-medium">Awaiting Manager</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Archived</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="policy">
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Company Leave Policy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl bg-slate-50">
                <span className="font-semibold text-slate-900 block mb-1">Carry Forward</span>
                Up to 15 days of PTO can be carried over into the next fiscal year.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50">
                <span className="font-semibold text-slate-900 block mb-1">Notice Required</span>
                Leaves longer than 3 days require 7-day prior supervisor intimation.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50">
                <span className="font-semibold text-slate-900 block mb-1">Sick Leave Docs</span>
                Medical certificate must be submitted for leaves exceeding 2 days.
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dynamic New Leave Request Form Dialog (B4) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Time Off Request</DialogTitle>
            <DialogDescription>
              Select employee, leave allocation category, dates, and reason for manager approval.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Employee</label>
              <select
                value={newRequest.employee}
                onChange={(e) => {
                  const emp = employees.find(emp => emp.name === e.target.value)
                  setNewRequest({
                    ...newRequest,
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

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Leave Type</label>
              <select
                value={newRequest.leave_type}
                onChange={(e) => setNewRequest({ ...newRequest, leave_type: e.target.value })}
                className="flex h-8 w-full rounded-lg border-0 bg-slate-100/90 px-2.5 py-1 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#714b67]/25"
              >
                <option value="Paid Time Off (PTO)">Paid Time Off (PTO)</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Compensatory Off">Compensatory Off</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Start Date</label>
                <Input
                  type="date"
                  required
                  value={newRequest.start_date}
                  onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                  className="h-8 text-xs bg-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">End Date</label>
                <Input
                  type="date"
                  required
                  value={newRequest.end_date}
                  onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                  className="h-8 text-xs bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Duration (Days)</label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={newRequest.days}
                  onChange={(e) => setNewRequest({ ...newRequest, days: Number(e.target.value) })}
                  className="h-8 text-xs bg-slate-50 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Reason / Notes</label>
                <Input
                  required
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  placeholder="e.g. Doctor appointment"
                  className="h-8 text-xs bg-slate-50"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-7 text-xs">
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
