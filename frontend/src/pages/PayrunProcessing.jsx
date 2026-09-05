import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Sparkles, CheckCircle2, AlertTriangle, ArrowLeft,
  FileText, ShieldCheck, Download, RefreshCw, Send, Check,
  Info, ScanLine
} from 'lucide-react'
import { usePayroll } from '@/context/PayrollContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import BulkEmailModal from '@/components/BulkEmailModal'

export default function PayrunProcessing() {
  const { id } = useParams()
  const {
    payruns, computePayrunBatch, validatePayrunBatch,
    markPayrunPaid, sendBulkPayslips, resolvePayrunWarning,
    reRunPayrunWarnings, permissions, showToast
  } = usePayroll()

  const payrun = payruns.find(p => String(p.id) === String(id)) || payruns[0]
  const [isScanning, setIsScanning]   = useState(false)
  const [isComputing, setIsComputing] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [printPayslip, setPrintPayslip]     = useState(null) // single payslip for print

  if (!payrun) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
        <AlertTriangle className="h-10 w-10 opacity-30" />
        <p className="text-sm">Payrun not found.</p>
        <Link to="/payruns"><Button variant="outline" size="sm">Back to Payruns</Button></Link>
      </div>
    )
  }

  const formatCurrency = (v) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0)

  const handleCompute = () => {
    setIsComputing(true)
    setTimeout(() => {
      computePayrunBatch(payrun.id)
      setIsComputing(false)
    }, 800)
  }

  const handleValidate = () => {
    setIsScanning(true)
    setTimeout(() => {
      validatePayrunBatch(payrun.id)
      setIsScanning(false)
    }, 900)
  }

  const handleRescan = () => {
    setIsScanning(true)
    setTimeout(() => {
      reRunPayrunWarnings(payrun.id)
      setIsScanning(false)
    }, 700)
  }

  const handleMarkPaid = () => markPayrunPaid(payrun.id)

  const handlePrintPayslip = (ps) => {
    setPrintPayslip(ps)
    setTimeout(() => {
      window.print()
      setPrintPayslip(null)
    }, 200)
  }

  const criticalCount  = (payrun.warnings || []).filter(w => w.severity === 'Critical').length
  const warningCount   = (payrun.warnings || []).filter(w => w.severity === 'Warning').length

  return (
    <div className="space-y-5">
      {/* Hidden print zone for individual payslip */}
      {printPayslip && (
        <div id="payslip-print-zone" className="print-only">
          <div style={{ fontFamily: 'Inter, sans-serif', padding: '40px', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#714b67', margin: 0 }}>PeoplePay360</h1>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>OxP Solutions Pvt. Ltd. · Bengaluru, Karnataka</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', color: '#64748b' }}>PAYSLIP</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{payrun.name}</p>
                <p style={{ fontSize: '11px', color: '#64748b' }}>{payrun.period_start} → {payrun.period_end}</p>
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px', color: '#0f172a' }}>{printPayslip.employee}</h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{printPayslip.role} · {printPayslip.structure}</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#714b67', color: 'white' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Component</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Earnings</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Deductions</th>
                </tr>
              </thead>
              <tbody>
                {(printPayslip.lineItems || []).map((li, i) => (
                  <tr key={li.code} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '7px 12px', color: '#374151' }}>{li.name}</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', color: '#059669' }}>{li.category === 'Allowance' ? `₹${li.amount.toLocaleString('en-IN')}` : ''}</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', color: '#dc2626' }}>{li.category === 'Deduction' ? `₹${li.amount.toLocaleString('en-IN')}` : ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: '700' }}>
                  <td style={{ padding: '10px 12px' }}>Total</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#059669' }}>₹{printPayslip.gross?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#dc2626' }}>₹{printPayslip.deductions?.toLocaleString('en-IN')}</td>
                </tr>
                <tr style={{ background: '#714b67', color: 'white', fontWeight: '700', fontSize: '14px' }}>
                  <td style={{ padding: '12px' }} colSpan={2}>Net Payable</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>₹{printPayslip.net?.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
            <p style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginTop: '32px' }}>
              This is a computer-generated payslip and does not require a signature. Generated on {new Date().toLocaleDateString('en-IN')}.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Link to="/payruns">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs shadow-xs border-0">
              <ArrowLeft className="h-3.5 w-3.5" /> All Payruns
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{payrun.name}</h1>
            <p className="text-xs text-slate-500">Period: {payrun.period_start} → {payrun.period_end} · {payrun.total_employees} employees</p>
          </div>
        </div>

        {/* Status Pipeline */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-full text-xs font-medium">
          {['Draft', 'Computed', 'Validated', 'Paid'].map(st => (
            <span key={st} className={`px-3 py-1 rounded-full transition-all ${
              payrun.status === st ? 'bg-[#714b67] text-white shadow-xs font-semibold' : 'text-slate-400'
            }`}>{st}</span>
          ))}
        </div>
      </div>

      {/* Action Toolbar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3 border-0">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={handleCompute}
            disabled={!permissions.canEditPayroll || payrun.status === 'Paid' || isComputing}
            className="gap-1.5 font-medium shadow-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${isComputing ? 'animate-spin' : ''}`} />
            {isComputing ? 'Computing…' : '1. Compute Sheet'}
          </Button>

          <Button size="sm" variant="teal" onClick={handleValidate}
            disabled={!permissions.canEditPayroll || isScanning || payrun.status === 'Draft' || payrun.status === 'Paid'}
            className="gap-1.5 font-medium shadow-xs">
            <ShieldCheck className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Validating…' : '2. Validate Batch'}
          </Button>

          <Button size="sm" variant="outline" onClick={handleMarkPaid}
            disabled={!permissions.canEditPayroll || payrun.status !== 'Validated'}
            className="gap-1.5 text-xs shadow-xs border-0">
            <Check className="h-3.5 w-3.5 text-emerald-600" /> 3. Mark Paid
          </Button>

          <Button size="sm" variant="outline" onClick={() => setShowEmailModal(true)}
            disabled={payrun.status === 'Draft'}
            className="gap-1.5 text-xs shadow-xs border-0">
            <Send className="h-3.5 w-3.5 text-blue-600" /> Send Payslips
          </Button>

          <Button size="sm" variant="outline" onClick={handleRescan}
            className="gap-1.5 text-xs shadow-xs border-0 text-amber-600" title="Re-scan payroll issues">
            <ScanLine className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} /> Re-scan Issues
          </Button>
        </div>

        <div className="flex items-center gap-5 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Staff</span>
            <span className="font-bold text-slate-900">{payrun.total_employees}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Gross</span>
            <span className="font-bold text-slate-900 tabular-nums">{formatCurrency(payrun.total_gross)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Net Payable</span>
            <span className="font-extrabold text-[#714b67] text-sm tabular-nums">{formatCurrency(payrun.total_net)}</span>
          </div>
        </div>
      </Card>

      {/* Payroll Issue Warning Panel */}
      {payrun.warnings && payrun.warnings.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Payroll Issues Detected ({criticalCount} Critical · {warningCount} Warnings)
            </h3>
            <span className="text-[11px] text-slate-400">Resolve before bank payout</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {payrun.warnings.map(w => (
              <Card key={w.id} className={`p-4 space-y-2.5 border-0 ${
                w.severity === 'Critical' ? 'bg-rose-50/70' : w.severity === 'Warning' ? 'bg-amber-50/60' : 'bg-blue-50/50'
              }`}>
                <div className="flex items-center justify-between">
                  <Badge variant={w.severity === 'Critical' ? 'danger' : w.severity === 'Warning' ? 'warning' : 'odooTeal'} className="text-[10px]">
                    {w.severity}
                  </Badge>
                  <span className="font-semibold text-xs text-slate-900 tabular-nums">Impact: {w.impact}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-900">{w.employee}</h4>
                  <p className="text-[10px] font-medium text-slate-600 mt-0.5">{w.type}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{w.description}</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" variant="teal"
                    onClick={() => resolvePayrunWarning(payrun.id, w.id)}
                    className="h-6 px-3 text-[11px] flex-1 rounded-full">
                    Resolve
                  </Button>
                  <Button size="sm" variant="ghost"
                    onClick={() => resolvePayrunWarning(payrun.id, w.id)}
                    className="h-6 px-2 text-[11px] text-slate-400 hover:text-slate-600 rounded-full">
                    Ignore
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No issues banner */}
      {payrun.warnings && payrun.warnings.length === 0 && payrun.status !== 'Draft' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-xl text-xs text-emerald-700 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          All payroll validation checks passed — no issues detected. Safe to proceed with bank disbursement.
        </div>
      )}

      {/* Payslips Table */}
      <Card className="p-0 overflow-hidden border-0">
        <div className="p-4 flex items-center justify-between border-b border-slate-50">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Generated Payslips</h3>
            <p className="text-xs text-slate-500">Rule-computed salary breakdown per employee</p>
          </div>
          <Badge variant="odoo">{payrun.payslips?.length || 0} Payslips</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Structure</TableHead>
              <TableHead className="text-right">Basic</TableHead>
              <TableHead className="text-right">HRA</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Salary</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrun.payslips && payrun.payslips.length > 0 ? payrun.payslips.map(ps => (
              <TableRow key={ps.id}>
                <TableCell className="font-semibold text-slate-900 text-xs">
                  {ps.employee}
                  <span className="block text-[10px] font-normal text-slate-400">{ps.role}</span>
                </TableCell>
                <TableCell className="text-[11px] text-slate-500">{ps.structure || payrun.structure}</TableCell>
                <TableCell className="text-right font-mono text-xs text-slate-700">{formatCurrency(ps.basic)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-slate-700">{formatCurrency(ps.hra)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-rose-600">−{formatCurrency(ps.deductions)}</TableCell>
                <TableCell className="text-right font-bold text-xs tabular-nums text-slate-900">{formatCurrency(ps.net)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={ps.status === 'Paid' ? 'success' : ps.status === 'Computed' ? 'odooTeal' : 'outline'} className="text-[10px]">
                    {ps.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`/payruns/${payrun.id}/report`}>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 text-[#714b67] hover:text-[#5f3e56]">
                        <FileText className="h-3 w-3" /> View
                      </Button>
                    </Link>
                    {ps.status !== 'Draft' && (
                      <Button variant="ghost" size="sm"
                        onClick={() => handlePrintPayslip(ps)}
                        className="h-6 px-2 text-xs gap-1 text-slate-500 hover:text-slate-800">
                        <Download className="h-3 w-3" /> PDF
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                  <Info className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
                  Click "Compute Sheet" to generate payslips using the Salary Rule Engine
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Bulk Email Modal */}
      {showEmailModal && (
        <BulkEmailModal payrun={payrun} onClose={() => setShowEmailModal(false)} />
      )}
    </div>
  )
}
