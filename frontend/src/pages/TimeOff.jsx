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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Time Off & Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review employee leave requests, approve allocations, and track statutory leaves.
          </p>
        </div>
        <Button className="gap-2 font-medium">
          <Plus className="h-4 w-4" /> New Leave Request
        </Button>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockBalances.map((b) => (
          <Card key={b.type} className="hover:border-primary/40 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {b.type}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  {b.remaining}{' '}
                  <span className="text-xs font-normal text-muted-foreground">days left</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {b.used}/{b.allocated} used
                </span>
              </div>
              <div className="w-full bg-muted/60 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${(b.used / b.allocated) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for Requests and History */}
      <Tabs defaultValue="requests" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="requests">Pending & Recent Requests</TabsTrigger>
            <TabsTrigger value="policy">Leave Policy & Rules</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search requests..."
              className="pl-9 h-8 text-xs"
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
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium text-foreground">
                      <div>
                        <div>{req.employee}</div>
                        <span className="text-[11px] text-muted-foreground">{req.department}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{req.leave_type}</TableCell>
                    <TableCell className="text-xs font-mono">
                      {req.start_date} to {req.end_date}
                    </TableCell>
                    <TableCell className="text-xs font-medium tabular-nums text-foreground">
                      {req.days} days
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
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
                        className="text-[10px]"
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAction(req.id, 'Approved')}
                            className="h-7 px-2.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAction(req.id, 'Refused')}
                            className="h-7 px-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Refuse
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="policy">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Statutory & Organizational Rules</CardTitle>
              <CardDescription className="text-xs">
                Company guidelines on encashment, notice period, and carryover
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-muted-foreground">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <div className="font-semibold text-foreground mb-1">Carryover Limit</div>
                <p>Maximum 15 days of PTO may be carried over to the next financial year starting 1st April.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <div className="font-semibold text-foreground mb-1">Notice Period for Extended Leaves</div>
                <p>Leaves exceeding 3 consecutive business days require minimum 7 days advance manager notification.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <div className="font-semibold text-foreground mb-1">Medical Certificate</div>
                <p>Sick leave lasting more than 2 consecutive days requires a certified physician note upload.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
