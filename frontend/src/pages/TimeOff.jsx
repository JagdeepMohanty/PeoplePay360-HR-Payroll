import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Umbrella, Plus, CheckCircle2, XCircle, Clock, Calendar,
  AlertTriangle, Filter, Search
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import client from '../api/client'

const mockRequests = [
  { id: 1, employee: 'Vikram Singh', department: 'Operations', leave_type: 'Paid Time Off (PTO)', start_date: '2026-09-04', end_date: '2026-09-08', days: 4, reason: 'Family function', status: 'Pending' },
  { id: 2, employee: 'Sneha Reddy', department: 'Marketing', leave_type: 'Sick Leave', start_date: '2026-09-02', end_date: '2026-09-03', days: 2, reason: 'Viral fever', status: 'Approved' },
  { id: 3, employee: 'Rohan Verma', department: 'Sales', leave_type: 'Casual Leave', start_date: '2026-09-15', end_date: '2026-09-16', days: 2, reason: 'Personal errands', status: 'Pending' },
  { id: 4, employee: 'Ananya Iyer', department: 'Engineering', leave_type: 'Paid Time Off (PTO)', start_date: '2026-08-20', end_date: '2026-08-22', days: 3, reason: 'Travel', status: 'Approved' },
  { id: 5, employee: 'Aarav Sharma', department: 'Engineering', leave_type: 'Comp Off', start_date: '2026-08-10', end_date: '2026-08-10', days: 1, reason: 'Weekend release support', status: 'Approved' },
]

const mockBalances = [
  { type: 'Paid Time Off (PTO)', allocated: 18, used: 6, remaining: 12 },
  { type: 'Sick Leave', allocated: 12, used: 3, remaining: 9 },
  { type: 'Casual Leave', allocated: 10, used: 4, remaining: 6 },
  { type: 'Compensatory Off', allocated: 4, used: 1, remaining: 3 },
]

export default function TimeOff() {
  const [requests, setRequests] = useState(mockRequests)
  const [searchTerm, setSearchTerm] = useState('')

  const handleAction = (id, newStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
  }

  const filteredRequests = requests.filter(
    (r) =>
      r.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.leave_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Time Off Management</h1>
          <p className="text-xs text-slate-500">Employee leave requests, approvals, and allocation balances.</p>
        </div>
        <Button className="gap-1.5 font-medium shadow-xs">
          <Plus className="h-3.5 w-3.5" /> New Leave Request
        </Button>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {mockBalances.map((b) => (
          <Card key={b.type}>
            <CardContent className="p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                {b.type}
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-xl font-bold tabular-nums text-slate-900">
                  {b.remaining}{' '}
                  <span className="text-xs font-normal text-slate-500">days left</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {b.used}/{b.allocated} used
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-[#714b67] h-full rounded-full"
                  style={{ width: `${(b.used / b.allocated) * 100}%` }}
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
            <TabsTrigger value="requests" className="text-xs rounded-full px-4">Leave Requests</TabsTrigger>
            <TabsTrigger value="policy" className="text-xs rounded-full px-4">Leave Policy</TabsTrigger>
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
                  <TableHead>Days</TableHead>
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
                          <Button
                            size="sm"
                            variant="teal"
                            onClick={() => handleAction(req.id, 'Approved')}
                            className="h-6 px-2.5 text-[11px] rounded-full"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(req.id, 'Refused')}
                            className="h-6 px-2.5 text-[11px] rounded-full"
                          >
                            Refuse
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Processed</span>
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
    </div>
  )
}
