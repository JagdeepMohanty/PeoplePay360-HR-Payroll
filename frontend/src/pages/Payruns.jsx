import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DollarSign, Plus, Search, Calendar, ArrowRight,
  CheckCircle2, Sparkles, FileCheck, CheckSquare, Square
} from 'lucide-react'
import { usePayroll } from '@/context/PayrollContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'

export default function Payruns() {
  const { payruns, createPayrun, employees, permissions } = usePayroll()
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)

  // Step 1 State: Scope
  const [payrunName, setPayrunName] = useState('Payrun - September 2026 Batch')
  const [periodStart, setPeriodStart] = useState('2026-09-01')
  const [periodEnd, setPeriodEnd] = useState('2026-09-30')
  const [salaryStructure, setSalaryStructure] = useState('Regular Tech Band 4')

  // Step 2 State: Explicit Employee Selection (B5)
  const [selectedEmpIds, setSelectedEmpIds] = useState(() => employees.map(e => e.id))

  const filtered = payruns.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)

  const toggleSelectAll = () => {
    if (selectedEmpIds.length === employees.length) {
      setSelectedEmpIds([])
    } else {
      setSelectedEmpIds(employees.map(e => e.id))
    }
  }

  const toggleEmp = (id) => {
    setSelectedEmpIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleFinishWizard = () => {
    if (selectedEmpIds.length === 0) return

    const created = createPayrun({
      name: payrunName,
      period_start: periodStart,
      period_end: periodEnd,
      structure: salaryStructure,
      selected_employee_ids: selectedEmpIds,
    })

    setIsWizardOpen(false)
    setWizardStep(1)
    // Direct navigation to processing view as requested in B5
    navigate(`/payruns/${created.id}/process`)
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Payroll Runs</h1>
          <p className="text-xs text-slate-500">Group payslips by period, calculate attendance deductions, and process disbursements.</p>
        </div>

        {permissions.canEditPayroll && (
          <Button
            onClick={() => {
              setWizardStep(1)
              setSelectedEmpIds(employees.map(e => e.id))
              setIsWizardOpen(true)
            }}
            className="gap-1.5 font-medium shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> New Payrun
          </Button>
        )}
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payrun batches..."
            className="pl-8 h-8 text-xs bg-white shadow-xs"
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
              <TableHead>Salary Structure</TableHead>
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
                <TableCell className="text-xs text-slate-600">
                  {pr.structure || 'Regular Tech Band 4'}
                </TableCell>
                <TableCell className="text-center text-xs font-semibold text-slate-700">
                  {pr.total_employees} staff
                </TableCell>
                <TableCell className="text-right tabular-nums font-bold text-slate-900">
                  {formatCurrency(pr.total_net)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={
                      pr.status === 'Paid'
                        ? 'success'
                        : pr.status === 'Validated'
                        ? 'odooTeal'
                        : pr.status === 'Computed'
                        ? 'odoo'
                        : 'warning'
                    }
                  >
                    {pr.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/payruns/${pr.id}/process`}>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 text-[#714b67] hover:text-[#5f3e56]">
                      Open Batch <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* B5) Payrun Creation Wizard Modal */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-1.5 text-[#714b67] text-[11px] font-semibold uppercase tracking-wider mb-0.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Step {wizardStep} of 2 — Payrun Setup</span>
            </div>
            <DialogTitle>
              {wizardStep === 1 ? 'Define Payrun Scope' : 'Select Eligible Employees'}
            </DialogTitle>
            <DialogDescription>
              {wizardStep === 1
                ? 'Specify the salary structure, batch name, and pay period range.'
                : 'Select the exact employees to include in this payroll calculation batch.'}
            </DialogDescription>
          </DialogHeader>

          {wizardStep === 1 ? (
            <div className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Batch Title</label>
                <Input
                  value={payrunName}
                  onChange={(e) => setPayrunName(e.target.value)}
                  className="h-8 text-xs bg-slate-50"
                  placeholder="e.g. October 2026 Regular Cycle"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Salary Structure</label>
                <select
                  value={salaryStructure}
                  onChange={(e) => setSalaryStructure(e.target.value)}
                  className="flex h-8 w-full rounded-lg border-0 bg-slate-100/90 px-2.5 py-1 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#714b67]/25"
                >
                  <option value="Regular Tech Band 4">Regular Tech Band 4 (Base 50% + HRA 20%)</option>
                  <option value="Executive HR Band 3">Executive HR Band 3</option>
                  <option value="Sales Base + Incentive">Sales Base + Incentive</option>
                  <option value="Operations Band 2">Operations Band 2</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Period Start Date</label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="h-8 text-xs bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Period End Date</label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="h-8 text-xs bg-slate-50"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2 text-xs">
              <div className="flex items-center justify-between pb-1">
                <span className="font-semibold text-slate-800">
                  {selectedEmpIds.length} of {employees.length} Employees Selected
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs text-[#714b67] font-semibold hover:underline"
                >
                  {selectedEmpIds.length === employees.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {employees.map((emp) => {
                  const isChecked = selectedEmpIds.includes(emp.id)
                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleEmp(emp.id)}
                      className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-[#714b67]/10 text-slate-900'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-[#714b67]" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-300" />
                        )}
                        <div>
                          <span className="font-semibold text-xs block">{emp.name}</span>
                          <span className="text-[10px] text-slate-500">{emp.job_position} · {emp.department}</span>
                        </div>
                      </div>
                      <span className="font-mono font-medium text-xs">
                        ₹{emp.wage?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            {wizardStep === 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWizardStep(1)}
                className="h-7 text-xs"
              >
                Back to Scope
              </Button>
            )}
            {wizardStep === 1 ? (
              <Button
                size="sm"
                onClick={() => setWizardStep(2)}
                className="h-7 text-xs font-medium"
              >
                Continue to Employee Selection →
              </Button>
            ) : (
              <Button
                size="sm"
                variant="teal"
                disabled={selectedEmpIds.length === 0}
                onClick={handleFinishWizard}
                className="h-7 text-xs gap-1 font-medium"
              >
                <Sparkles className="h-3 w-3" /> Initialize Payrun Batch
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
