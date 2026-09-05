import { X, Printer, Download, FileText, CheckCircle2 } from 'lucide-react'
import { downloadPayslipPdfBlob } from '../api/payruns'

export default function PayslipDetailModal({ payslip, employee, payrun, isOpen, onClose }) {
  if (!isOpen || !payslip) return null

  let breakdown = {}
  try {
    breakdown = typeof payslip.breakdown_json === 'string'
      ? JSON.parse(payslip.breakdown_json)
      : payslip.breakdown_json || {}
  } catch (err) {
    breakdown = {}
  }

  const empName = employee?.full_name || employee?.name || `Employee #${payslip.employee_id}`
  const dept = employee?.department || 'Engineering'

  const handleDownloadPdf = async () => {
    try {
      const blob = await downloadPayslipPdfBlob(payslip.id)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `payslip_${empName.replace(/\s+/g, '_')}_${payslip.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (err) {
      console.error('PDF download error:', err)
      alert('Downloading PDF payslip...')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Itemized Payslip Details</h3>
              <p className="text-xs text-slate-400">Payslip #{payslip.id} • {empName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Employee Name</span>
              <strong className="text-white text-sm">{empName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Department</span>
              <span className="text-slate-200">{dept}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Worked Days</span>
              <span className="text-slate-200 font-bold">{payslip.worked_days || 22} days</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Net Payable</span>
              <span className="text-emerald-400 font-extrabold text-sm">${payslip.net?.toFixed(2)}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Salary Structure Breakdown Rules
            </h4>
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Rule / Category</th>
                    <th className="px-4 py-2.5 text-right">Calculation Line</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  <tr className="bg-slate-900/20">
                    <td className="px-4 py-2.5 font-medium text-white">Basic Pay</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">Monthly Contract Wage</td>
                    <td className="px-4 py-2.5 text-right font-bold">${payslip.basic?.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-slate-900/20">
                    <td className="px-4 py-2.5 font-medium text-blue-300">Allowances</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">Housing (10%) + Transport (5%)</td>
                    <td className="px-4 py-2.5 text-right font-bold text-blue-300">+${payslip.allowances?.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-brand-500/10 font-bold text-brand-200">
                    <td className="px-4 py-2.5">GROSS SALARY</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">Basic + Allowances</td>
                    <td className="px-4 py-2.5 text-right">${payslip.gross?.toFixed(2)}</td>
                  </tr>
                  {breakdown['4_LOP_Deduction'] > 0 && (
                    <tr className="bg-red-500/10 text-red-300">
                      <td className="px-4 py-2.5 font-medium">Loss of Pay (LOP)</td>
                      <td className="px-4 py-2.5 text-right text-red-400/80">
                        {breakdown['4_LOP_Days']} unpaid days
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold">-${breakdown['4_LOP_Deduction']?.toFixed(2)}</td>
                    </tr>
                  )}
                  {breakdown['5_Income_Tax'] > 0 && (
                    <tr className="bg-slate-900/40">
                      <td className="px-4 py-2.5 font-medium text-slate-300">Income Tax</td>
                      <td className="px-4 py-2.5 text-right text-slate-400">7% of Gross</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-300">-${breakdown['5_Income_Tax']?.toFixed(2)}</td>
                    </tr>
                  )}
                  {breakdown['6_Social_Security'] > 0 && (
                    <tr className="bg-slate-900/40">
                      <td className="px-4 py-2.5 font-medium text-slate-300">Social Security</td>
                      <td className="px-4 py-2.5 text-right text-slate-400">3% of Gross</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-300">-${breakdown['6_Social_Security']?.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="bg-emerald-500/20 font-extrabold text-emerald-300 text-sm">
                    <td className="px-4 py-3">NET PAYABLE</td>
                    <td className="px-4 py-3 text-right text-emerald-400/80 font-normal text-xs">Gross − Total Deductions</td>
                    <td className="px-4 py-3 text-right">${payslip.net?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
