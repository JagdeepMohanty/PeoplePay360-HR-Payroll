import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  DollarSign, Plus, Search, Calendar, ArrowRight,
  CheckCircle2, Sparkles, Clock, AlertCircle, FileCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

  // Form State for Payrun Wizard
  const [payrunName, setPayrunName] = useState('September 2026 - Regular Cycle')
  const [periodStart, setPeriodStart] = useState('2026-09-01')
  const [periodEnd, setPeriodEnd] = useState('2026-09-30')
  const [selectedDept, setSelectedDept] = useState('All Departments (92 Employees)')

  const queryClient = useQueryClient()

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

  const handleCreatePayrun = () => {
    setIsWizardOpen(false)
    setWizardStep(1)
    // Could navigate to the processing page
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Payroll Runs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate salary batches, calculate attendance deductions, and execute payouts.
          </p>
        </div>
        <Button onClick={() => setIsWizardOpen(true)} className="gap-2 font-medium">
          <Plus className="h-4 w-4" /> Create Payrun Batch
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/60 p-3 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payrun batches..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Payrun History Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payrun Batch</TableHead>
              <TableHead>Period Range</TableHead>
              <TableHead className="text-center">Employees</TableHead>
              <TableHead className="text-right">Total Net Payout</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((pr) => (
              <TableRow key={pr.id}>
                <TableCell className="font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary" />
                    <span>{pr.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {pr.period_start} → {pr.period_end}
                </TableCell>
                <TableCell className="text-center text-xs font-medium">
                  {pr.total_employees} staff
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-foreground">
                  {formatCurrency(pr.total_net)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={pr.status === 'Paid' ? 'success' : 'warning'}
                    className="text-[10px]"
                  >
                    {pr.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/payruns/${pr.id}/process`}>
                    <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs gap-1">
                      Manage Run <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modern 2-Step Payrun Creation Wizard (Excalidraw mockup) */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Step {wizardStep} of 2</span>
            </div>
            <DialogTitle>
              {wizardStep === 1 ? 'Configure Payroll Batch' : 'Confirm Eligible Employees'}
            </DialogTitle>
            <DialogDescription>
              {wizardStep === 1
                ? 'Set the pay period dates, title, and structure for this payroll batch.'
                : 'Review employees covered under active contracts before computing.'}
            </DialogDescription>
          </DialogHeader>

          {wizardStep === 1 ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Payrun Title</label>
                <Input
                  value={payrunName}
                  onChange={(e) => setPayrunName(e.target.value)}
                  placeholder="e.g. September 2026 Regular Cycle"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">End Date</label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Target Group</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="All" className="bg-card text-foreground">
                    All Departments (92 Employees)
                  </option>
                  <option value="Engineering" className="bg-card text-foreground">
                    Engineering Team (34 Employees)
                  </option>
                  <option value="Sales" className="bg-card text-foreground">
                    Sales & Operations (40 Employees)
                  </option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cycle:</span>
                  <span className="font-medium text-foreground">{payrunName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dates:</span>
                  <span className="font-mono text-foreground">{periodStart} to {periodEnd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eligible Employees:</span>
                  <Badge variant="success" className="text-[10px]">92 Ready for Calculation</Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-muted-foreground">
                  <span className="font-semibold text-emerald-400 block mb-0.5">Biometrics & Leave Verified</span>
                  All biometric check-ins and approved PTOs for this timeframe have been synchronized.
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {wizardStep === 2 && (
              <Button variant="outline" size="sm" onClick={() => setWizardStep(1)}>
                Back
              </Button>
            )}
            {wizardStep === 1 ? (
              <Button size="sm" onClick={() => setWizardStep(2)}>
                Next: Verify Staff
              </Button>
            ) : (
              <Link to="/payruns/4/process" onClick={() => setIsWizardOpen(false)}>
                <Button size="sm" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Compute Payroll
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
