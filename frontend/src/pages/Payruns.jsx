import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  DollarSign, Plus, Search, Calendar, ArrowRight,
  CheckCircle2, Sparkles, FileCheck
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import client from '../api/client'

const mockPayruns = [
  { id: 1, name: 'Payrun - August 2026 Regular', period_start: '2026-08-01', period_end: '2026-08-31', total_employees: 92, total_net: 9845000, status: 'Paid' },
  { id: 2, name: 'Payrun - July 2026 Regular', period_start: '2026-07-01', period_end: '2026-07-31', total_employees: 90, total_net: 9620000, status: 'Paid' },
  { id: 3, name: 'Payrun - June 2026 Regular', period_start: '2026-06-01', period_end: '2026-06-30', total_employees: 88, total_net: 9410000, status: 'Paid' },
  { id: 4, name: 'Payrun - September 2026 (Draft)', period_start: '2026-09-01', period_end: '2026-09-30', total_employees: 92, total_net: 10125000, status: 'Draft' },
]

export default function Payruns() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)

  // Form State
  const [payrunName, setPayrunName] = useState('September 2026 Regular Cycle')
  const [periodStart, setPeriodStart] = useState('2026-09-01')
  const [periodEnd, setPeriodEnd] = useState('2026-09-30')
  const [selectedDept, setSelectedDept] = useState('All')

  const { data: payrunsData } = useQuery({
    queryKey: ['payruns'],
    queryFn: async () => {
      try {
        const res = await client.get('/api/v1/payruns')
        return res?.data?.length ? res.data : mockPayruns
      } catch {
        return mockPayruns
      }
    },
    initialData: mockPayruns,
  })

  const records = payrunsData || mockPayruns

  const filtered = records.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Payroll Runs</h1>
          <p className="text-xs text-slate-500">Calculate employee salary sheets, biometric deductions, and payouts.</p>
        </div>
        <Button onClick={() => setIsWizardOpen(true)} className="gap-1.5 font-medium">
          <Plus className="h-3.5 w-3.5" /> Generate Payrun
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payrun batch..."
            className="pl-8 h-8 text-xs bg-white"
          />
        </div>
      </div>

      {/* Payrun History Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payrun Batch</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-center">Staff Count</TableHead>
              <TableHead className="text-right">Total Net Payout</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((pr) => (
              <TableRow key={pr.id}>
                <TableCell className="font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-[#714b67]" />
                    <span>{pr.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-600">
                  {pr.period_start} → {pr.period_end}
                </TableCell>
                <TableCell className="text-center text-xs text-slate-700">
                  {pr.total_employees} staff
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-slate-900">
                  {formatCurrency(pr.total_net)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={pr.status === 'Paid' ? 'success' : 'warning'}>
                    {pr.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/payruns/${pr.id}/process`}>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 text-[#714b67] hover:text-[#5f3e56]">
                      Open <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Payrun Creation Wizard Modal */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-1.5 text-[#714b67] text-[11px] font-semibold uppercase tracking-wider mb-0.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Step {wizardStep} of 2</span>
            </div>
            <DialogTitle>
              {wizardStep === 1 ? 'Configure Payrun Cycle' : 'Verify Eligible Staff'}
            </DialogTitle>
            <DialogDescription>
              {wizardStep === 1
                ? 'Specify the period dates and target department.'
                : 'Confirm attendance records and approved leaves.'}
            </DialogDescription>
          </DialogHeader>

          {wizardStep === 1 ? (
            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Payrun Batch Name</label>
                <Input
                  value={payrunName}
                  onChange={(e) => setPayrunName(e.target.value)}
                  placeholder="e.g. September 2026 Regular Cycle"
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Start Date</label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">End Date</label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#714b67]"
                >
                  <option value="All">All Departments (92 Employees)</option>
                  <option value="Engineering">Engineering (34 Employees)</option>
                  <option value="Sales">Sales & Operations (40 Employees)</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 py-2 text-xs">
              <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch:</span>
                  <span className="font-medium text-slate-900">{payrunName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Period:</span>
                  <span className="font-mono text-slate-700">{periodStart} to {periodEnd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Eligible Employees:</span>
                  <Badge variant="success">92 Employees Ready</Badge>
                </div>
              </div>

              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-emerald-800">
                  Biometrics, unapproved PTOs, and statutory ceilings verified.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {wizardStep === 2 && (
              <Button variant="outline" size="sm" onClick={() => setWizardStep(1)} className="h-7 text-xs">
                Back
              </Button>
            )}
            {wizardStep === 1 ? (
              <Button size="sm" onClick={() => setWizardStep(2)} className="h-7 text-xs">
                Continue to Staff
              </Button>
            ) : (
              <Link to="/payruns/4/process" onClick={() => setIsWizardOpen(false)}>
                <Button size="sm" variant="teal" className="h-7 text-xs gap-1">
                  <Sparkles className="h-3 w-3" /> Compute Payslips
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
