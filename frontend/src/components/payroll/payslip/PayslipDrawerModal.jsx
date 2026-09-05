import React, { useState } from 'react'
import { X, Printer, Download, Mail, CheckCircle2, AlertCircle, Building2, Calendar, User, Clock } from 'lucide-react'
import PayrollStatusBadge from '../common/PayrollStatusBadge'
import { dispatchPayslipEmail, generatePayslipPdf } from '../../../api/payrollAdapter'

export default function PayslipDrawerModal({ payslip, onClose }) {
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  if (!payslip) return null

  const lines = Array.isArray(payslip.lines) ? payslip.lines : []
  const earnings = lines.filter(l => !l.is_deduction)
  const deductions = lines.filter(l => l.is_deduction)

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true)
    try {
      const res = await generatePayslipPdf(payslip.id)
      showToast(res.message || `PDF for Payslip #${payslip.id} downloaded successfully.`, 'success')
    } catch (err) {
      showToast(`Failed to download PDF: ${err.message}`, 'error')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    try {
      const res = await dispatchPayslipEmail(payslip.id)
      showToast(res.message || `Payslip #${payslip.id} emailed to ${payslip.employee_name}.`, 'success')
    } catch (err) {
      showToast(`Failed to send email: ${err.message}`, 'error')
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-end z-50 p-0">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold">Itemized Payslip Breakdown</h2>
            <PayrollStatusBadge status={payslip.state} size="small" />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between ${
            toastMessage.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
          }`}>
            <span className="flex items-center gap-1.5">
              {toastMessage.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
              {toastMessage.text}
            </span>
            <button onClick={() => setToastMessage(null)}><X size={14} /></button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Employee & Payrun Metadata Header */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-gray-400 flex items-center gap-1"><User size={12} /> Employee</p>
              <p className="font-bold text-gray-900 mt-0.5">{payslip.employee_name}</p>
              <p className="text-[11px] text-gray-500">{payslip.job_title}</p>
            </div>
            <div>
              <p className="text-gray-400 flex items-center gap-1"><Building2 size={12} /> Department</p>
              <p className="font-bold text-gray-900 mt-0.5">{payslip.department}</p>
            </div>
            <div>
              <p className="text-gray-400 flex items-center gap-1"><Calendar size={12} /> Pay Period</p>
              <p className="font-bold text-gray-900 mt-0.5">{payslip.period_start}</p>
              <p className="text-[11px] text-gray-500">to {payslip.period_end}</p>
            </div>
            <div>
              <p className="text-gray-400 flex items-center gap-1"><Clock size={12} /> Worked Days</p>
              <p className="font-bold text-gray-900 mt-0.5">{payslip.worked_days || 22} Days</p>
              <p className="text-[11px] text-gray-500">{payslip.structure_name || 'Standard Structure'}</p>
            </div>
          </div>

          {/* Salary Line Items Breakdown Table */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dynamically Rendered Payslip Lines</h3>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Code</th>
                    <th className="px-4 py-2.5 text-left">Description</th>
                    <th className="px-4 py-2.5 text-left">Category</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line) => (
                    <tr key={line.id || line.code} className="hover:bg-gray-50/80">
                      <td className="px-4 py-2.5 font-mono font-bold text-gray-700">{line.code}</td>
                      <td className="px-4 py-2.5 text-gray-900 font-medium">{line.name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          line.category === 'basic' ? 'bg-blue-100 text-blue-800' :
                          line.category === 'allowance' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {line.category}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold ${
                        line.is_deduction ? 'text-rose-600' : 'text-gray-900'
                      }`}>
                        {line.is_deduction ? '-' : ''}${line.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Cards: Gross, Deductions, Net */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
              <p className="text-[11px] font-medium text-blue-700">Gross Salary</p>
              <p className="text-lg font-bold text-blue-900 mt-0.5">${payslip.gross_pay?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
              <p className="text-[11px] font-medium text-rose-700">Total Deductions</p>
              <p className="text-lg font-bold text-rose-900 mt-0.5">-${payslip.total_deductions?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
              <p className="text-[11px] font-medium text-emerald-700">Net Payable</p>
              <p className="text-lg font-bold text-emerald-900 mt-0.5">${payslip.net_pay?.toLocaleString() || 0}</p>
            </div>
          </div>

        </div>

        {/* Footer Actions (Part E) */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 transition-colors"
          >
            <Printer size={14} /> Print / View
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors"
            >
              <Download size={14} /> {isDownloadingPdf ? 'Generating PDF…' : 'Download PDF'}
            </button>

            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Mail size={14} /> {isSendingEmail ? 'Dispatching Email…' : 'Send Email Payslip'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
