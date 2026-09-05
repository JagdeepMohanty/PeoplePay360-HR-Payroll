import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import {
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft,
  FileText, ShieldCheck, Download, RefreshCw, Check
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import client from '../api/client'

const mockExceptions = [
  { id: 'EX-1', employee: 'Vikram Singh', type: 'Unapproved Leave Deduction', impact: '₹2,857', severity: 'Critical', description: '4 days unapproved PTO pending manager signoff' },
  { id: 'EX-2', employee: 'Sneha Reddy', type: 'Late Check-in LOP', impact: '₹1,200', severity: 'Warning', description: '3 consecutive late check-ins exceeding grace period' },
  { id: 'EX-3', employee: 'Aarav Sharma', type: 'PF Ceiling Validation', impact: '₹0', severity: 'Info', description: 'Voluntary PF contribution opt-in confirmed' },
]

const mockComputedPayslips = [
  { id: 101, employee: 'Aarav Sharma', role: 'Tech Lead', gross: 175000, deductions: 24800, net: 150200, status: 'Computed' },
  { id: 102, employee: 'Priya Patel', role: 'HR Manager', gross: 125000, deductions: 18200, net: 106800, status: 'Computed' },
  { id: 103, employee: 'Rohan Verma', role: 'Sales Executive', gross: 95000, deductions: 14100, net: 80900, status: 'Computed' },
  { id: 104, employee: 'Ananya Iyer', role: 'Frontend Engineer', gross: 110000, deductions: 16500, net: 93500, status: 'Computed' },
  { id: 105, employee: 'Vikram Singh', role: 'Operations Specialist', gross: 85000, deductions: 15657, net: 69343, status: 'Warning' },
]

export default function PayrunProcessing() {
  const { id } = useParams()
  const [stage, setStage] = useState('Computed') // Draft, Computed, Validated, Paid
  const [exceptions, setExceptions] = useState(mockExceptions)
  const [isScanning, setIsScanning] = useState(false)
  const [scanStep, setScanStep] = useState(0)

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)

  const handleFixNow = (exceptionId) => {
    setExceptions((prev) => prev.filter((e) => e.id !== exceptionId))
  }

  const handleRunGuardian = () => {
    setIsScanning(true)
    setScanStep(1)
    setTimeout(() => setScanStep(2), 500)
    setTimeout(() => setScanStep(3), 1000)
    setTimeout(() => {
      setIsScanning(false)
      setScanStep(0)
      setStage('Validated')
    }, 1500)
  }

  return (
    <div className="space-y-5">
      {/* Header & Odoo Status Stage Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Link to="/payruns">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Payrun Batch #{id || '04'} — September 2026
            </h1>
            <p className="text-xs text-slate-500">Regular payroll calculation cycle for 92 employees.</p>
          </div>
        </div>

        {/* Odoo Status Chevron Pipeline */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-full text-xs font-medium">
          {['Draft', 'Computed', 'Validated', 'Paid'].map((st, idx) => (
            <span
              key={st}
              className={`px-3 py-1 rounded-full transition-all ${
                stage === st
                  ? 'bg-[#714b67] text-white shadow-xs font-semibold'
                  : 'text-slate-500'
              }`}
            >
              {st}
            </span>
          ))}
        </div>
      </div>

      {/* Guardian Scanner Card */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#714b67]/10 text-[#714b67]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Payroll Guardian Compliance Scan</h2>
              <p className="text-xs text-slate-500">
                Automated validation of biometric logs, unapproved leaves, and statutory PF/ESI ceilings.
              </p>
            </div>
          </div>

          <Button
            onClick={handleRunGuardian}
            disabled={isScanning}
            className="gap-2 font-medium"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning Rules...' : 'Run Payroll Guardian'}
          </Button>
        </div>

        {isScanning && (
          <div className="p-3 rounded-xl bg-slate-50 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Verifying biometric punch clocks across Bangalore HQ...</span>
            </div>
            {scanStep >= 2 && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Checking approved PTO vs loss-of-pay deductions...</span>
              </div>
            )}
            {scanStep >= 3 && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Calculating statutory PF (12%) & Professional Tax ceilings...</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Exceptions Section */}
      {exceptions.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Requires Attention ({exceptions.length} Items)
            </h3>
            <span className="text-[11px] text-slate-400">Resolve items to reach 100% compliance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {exceptions.map((ex) => (
              <Card key={ex.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={ex.severity === 'Critical' ? 'danger' : 'warning'}
                    className="text-[10px]"
                  >
                    {ex.severity}
                  </Badge>
                  <span className="font-semibold text-xs text-slate-900 tabular-nums">
                    Impact: {ex.impact}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-900">{ex.employee}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{ex.description}</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="teal"
                    onClick={() => handleFixNow(ex.id)}
                    className="h-6 px-2.5 text-[11px] flex-1"
                  >
                    Fix Now
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleFixNow(ex.id)}
                    className="h-6 px-2 text-[11px] text-slate-400 hover:text-slate-600"
                  >
                    Ignore
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Computed Payslips Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Generated Payslips Summary</h3>
            <p className="text-xs text-slate-500">Gross earnings, statutory deductions, and payable net salary</p>
          </div>
          <Badge variant="success">92 Payslips Ready</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead className="text-right">Gross Salary</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Payable</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockComputedPayslips.map((ps) => (
              <TableRow key={ps.id}>
                <TableCell className="font-semibold text-slate-900">{ps.employee}</TableCell>
                <TableCell className="text-xs text-slate-500">{ps.role}</TableCell>
                <TableCell className="text-right font-medium tabular-nums text-slate-700">
                  {formatCurrency(ps.gross)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums text-rose-600">
                  −{formatCurrency(ps.deductions)}
                </TableCell>
                <TableCell className="text-right font-bold tabular-nums text-slate-900">
                  {formatCurrency(ps.net)}
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/payruns/${id || 4}/report`}>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 text-[#714b67] hover:text-[#5f3e56]">
                      <FileText className="h-3 w-3" /> View Payslip
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
