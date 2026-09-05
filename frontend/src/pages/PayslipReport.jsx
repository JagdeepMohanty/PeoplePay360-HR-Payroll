import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, Download, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function PayslipReport() {
  const { id } = useParams()
  const [showExplanation, setShowExplanation] = useState(false)

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val)

  const payslip = {
    employee_name: 'Aarav Sharma',
    employee_id: 'EMP-001',
    department: 'Engineering',
    designation: 'Tech Lead',
    pan_number: 'ABCDE1234F',
    bank_account: 'HDFC •••• 4829',
    uan: '101293847562',
    period: '01 Sep 2026 – 30 Sep 2026',
    pay_date: '30 Sep 2026',
    earnings: [
      { name: 'Basic Salary (50%)', amount: 87500 },
      { name: 'House Rent Allowance (HRA)', amount: 35000 },
      { name: 'Special Allowance', amount: 42500 },
      { name: 'Performance Incentive', amount: 10000 },
    ],
    deductions: [
      { name: 'Provident Fund (Employee)', amount: 10500 },
      { name: 'Professional Tax (PT)', amount: 200 },
      { name: 'Tax Deducted at Source (TDS)', amount: 14100 },
    ],
    deltas: [
      { name: 'Basic & HRA', delta: '+₹0', reason: 'Base salary unchanged' },
      { name: 'Performance Incentive', delta: '+₹10,000', reason: 'Q2 Milestone Bonus approved' },
      { name: 'TDS Tax Deduction', delta: '−₹1,400', reason: 'Adjusted for bonus slab' },
    ],
  }

  const grossEarnings = payslip.earnings.reduce((a, b) => a + b.amount, 0)
  const totalDeductions = payslip.deductions.reduce((a, b) => a + b.amount, 0)
  const netPayable = grossEarnings - totalDeductions

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-12">
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-between no-print">
        <Link to={`/payruns/${id || 4}/process`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Batch
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs h-7"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button size="sm" className="gap-1.5 text-xs h-7">
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Main Payslip Sheet (0 outlines, smooth elevation) */}
      <Card className="p-8 space-y-6">
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#714b67] text-white font-bold flex items-center justify-center text-xs">
                OXP
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">OXP Technologies Pvt Ltd</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Bangalore Tech Park, Outer Ring Road, Karnataka</p>
          </div>
          <div className="text-left sm:text-right">
            <Badge variant="odoo" className="text-xs font-semibold px-2.5 py-1">
              Salary Payslip
            </Badge>
            <p className="text-xs text-slate-500 mt-1 font-mono">Period: {payslip.period}</p>
          </div>
        </div>

        {/* Employee Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/70 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Employee Name</span>
            <span className="font-semibold text-slate-900">{payslip.employee_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Employee ID</span>
            <span className="font-mono text-slate-800">{payslip.employee_id}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Department / Role</span>
            <span className="text-slate-800">{payslip.department} · {payslip.designation}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Bank Account</span>
            <span className="font-mono text-slate-800">{payslip.bank_account}</span>
          </div>
        </div>

        {/* Two-Column Earnings and Deductions Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Earnings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Earnings & Allowances
            </h3>
            <div className="space-y-2 text-xs">
              {payslip.earnings.map((e) => (
                <div key={e.name} className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">{e.name}</span>
                  <span className="font-medium tabular-nums text-slate-900">{formatCurrency(e.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-xs font-bold text-slate-900 border-t border-slate-100">
                <span>Total Gross Earnings</span>
                <span className="tabular-nums">{formatCurrency(grossEarnings)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Deductions & Taxes
            </h3>
            <div className="space-y-2 text-xs">
              {payslip.deductions.map((d) => (
                <div key={d.name} className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">{d.name}</span>
                  <span className="font-medium tabular-nums text-rose-600">−{formatCurrency(d.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-xs font-bold text-slate-900 border-t border-slate-100">
                <span>Total Deductions</span>
                <span className="tabular-nums text-rose-600">−{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Salary Highlight Box */}
        <div className="p-5 rounded-xl bg-[#714b67]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-[#714b67] uppercase tracking-wider block">
              Net Payout to Bank
            </span>
            <span className="text-2xl font-black text-[#714b67] tabular-nums tracking-tight">
              {formatCurrency(netPayable)}
            </span>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-500">
            <div>Disbursement: <span className="font-medium text-slate-700">Direct Deposit</span></div>
            <div>Pay Date: <span className="font-mono text-slate-700">{payslip.pay_date}</span></div>
          </div>
        </div>

        {/* "Why Did This Change?" Explainable Diff Panel */}
        <div className="no-print pt-2">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1.5 text-xs text-[#714b67] font-semibold hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Why did this payslip change vs last month?</span>
            {showExplanation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showExplanation && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 space-y-2.5 text-xs animate-in fade-in duration-150">
              <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
                Period Comparison Deltas (vs August 2026)
              </span>
              <div className="space-y-1.5">
                {payslip.deltas.map((del) => (
                  <div key={del.name} className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">
                      <strong className="text-slate-900">{del.name}:</strong> {del.reason}
                    </span>
                    <span className={`font-mono font-bold ${del.delta.startsWith('+') ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {del.delta}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-1 text-xs text-slate-600 font-medium">
                Net difference: <span className="text-emerald-700 font-bold">+₹8,600.00</span> compared to previous cycle.
              </div>
            </div>
          )}
        </div>

        {/* Compliance Footer */}
        <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 text-center">
          This is an electronically generated salary advice under OXP PeoplePay360 compliance engine. No physical signature required.
        </div>
      </Card>
    </div>
  )
}
