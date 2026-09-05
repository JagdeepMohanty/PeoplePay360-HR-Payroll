import React from 'react'
import { FileText, Mail, Download, CheckCircle } from 'lucide-react'
import PayrollStatusBadge from '../common/PayrollStatusBadge'

export default function PayslipBreakdown({ payslip, onDownloadPdf, onSendEmail }) {
  if (!payslip) return null

  const lines = Array.isArray(payslip.lines) ? payslip.lines : []
  const earnings = lines.filter(l => !l.is_deduction)
  const deductions = lines.filter(l => l.is_deduction)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{payslip.employee_name}</h2>
            <PayrollStatusBadge status={payslip.state} size="small" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {payslip.job_title} · <span className="font-medium text-gray-700">{payslip.department}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Pay Period: {payslip.period_start} → {payslip.period_end}</p>
        </div>

        <div className="flex items-center gap-2">
          {onDownloadPdf && (
            <button
              onClick={() => onDownloadPdf(payslip.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download size={14} /> PDF Payslip
            </button>
          )}
          {onSendEmail && (
            <button
              onClick={() => onSendEmail(payslip.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Mail size={14} /> Email Payslip
            </button>
          )}
        </div>
      </div>

      {/* Itemized Line Items Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Earnings Column */}
        <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Earnings & Allowances</h3>
          <div className="space-y-2 text-sm">
            {earnings.map((line) => (
              <div key={line.id || line.code} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                <span className="text-gray-600 text-xs">{line.name}</span>
                <span className="font-semibold text-gray-900 text-xs">${line.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 font-bold text-xs text-gray-900">
            <span>Gross Salary</span>
            <span className="text-blue-700">${payslip.gross_pay?.toLocaleString() || 0}</span>
          </div>
        </div>

        {/* Deductions Column */}
        <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Deductions</h3>
          <div className="space-y-2 text-sm">
            {deductions.map((line) => (
              <div key={line.id || line.code} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                <span className="text-gray-600 text-xs">{line.name}</span>
                <span className="font-semibold text-rose-600 text-xs">-${line.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 font-bold text-xs text-gray-900">
            <span>Total Deductions</span>
            <span className="text-rose-600">-${payslip.total_deductions?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {/* Net Payable Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="text-emerald-600" size={20} />
          <div>
            <p className="text-xs font-semibold text-emerald-900 uppercase">Net Payable Amount</p>
            <p className="text-xs text-emerald-700">Calculated after statutory tax and benefit deductions</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-emerald-800">${payslip.net_pay?.toLocaleString() || 0}</p>
        </div>
      </div>
    </div>
  )
}
