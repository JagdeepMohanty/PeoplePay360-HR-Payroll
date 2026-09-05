import { X, Download, FileText, ExternalLink, Building, CreditCard, Calendar, User } from 'lucide-react'
import { downloadPayslipPdfBlob } from '../api/payruns'
import odooLogo from '../assets/odoo_logo.png'

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

  const empName = employee?.full_name || `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim() || `Employee #${payslip.employee_id}`
  const dept = employee?.department || 'General'
  const jobPosition = employee?.job_position || 'Staff Member'
  const bankAccount = employee?.bank_account || 'Direct Deposit'

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0)

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
      window.print()
    }
  }

  const handleOpenPdf = async () => {
    try {
      const blob = await downloadPayslipPdfBlob(payslip.id)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch (err) {
      console.error('PDF open error:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop overlay click */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border-0 my-auto animate-in fade-in zoom-in-95 duration-150 z-10">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <img src={odooLogo} alt="Odoo" className="h-7 w-auto object-contain shrink-0" />
            <div className="border-l border-slate-200 pl-3">
              <h3 className="text-sm font-bold text-slate-900">Official Payslip Details</h3>
              <p className="text-[11px] text-slate-400">Payslip #{payslip.id} • {empName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleOpenPdf}
              title="Open and preview PDF in new tab"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border-0 cursor-pointer transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview PDF</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#714b67] hover:bg-[#5e3e56] text-white text-xs font-semibold shadow-xs border-0 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-0 cursor-pointer transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Employee Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50/80 border-0 text-xs">
            <div>
              <span className="text-slate-400 block font-medium text-[10px] flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Employee Name
              </span>
              <strong className="text-slate-900 text-xs truncate block mt-0.5">{empName}</strong>
              <span className="text-[10px] text-slate-400 block truncate">{jobPosition}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium text-[10px] flex items-center gap-1">
                <Building className="w-3 h-3 text-slate-400" /> Department
              </span>
              <span className="text-slate-800 font-semibold block mt-0.5">{dept}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium text-[10px] flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-slate-400" /> Bank / Account
              </span>
              <span className="text-slate-700 font-mono text-[11px] block mt-0.5 truncate">{bankAccount}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#714b67]" /> Net Take-Home
              </span>
              <span className="text-[#714b67] font-black text-sm block mt-0.5">{formatCurrency(payslip.net)}</span>
            </div>
          </div>

          {/* Salary Structure Breakdown Rules Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Salary Structure Breakdown Rules
              </h4>
              <span className="text-[10px] font-medium text-slate-400">Regular Monthly Structure</span>
            </div>

            <div className="overflow-hidden rounded-xl bg-white shadow-2xs border-0 border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Rule / Category</th>
                    <th className="px-4 py-3 text-right">Calculation Rule</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">Basic Pay</td>
                    <td className="px-4 py-3 text-right text-slate-400">Monthly Contract Base Wage</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(payslip.basic)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-600">Allowances</td>
                    <td className="px-4 py-3 text-right text-slate-400">Housing (10%) + Transport (5%)</td>
                    <td className="px-4 py-3 text-right font-bold text-[#00A09D]">+{formatCurrency(payslip.allowances)}</td>
                  </tr>
                  <tr className="bg-slate-50/80 font-bold text-slate-900">
                    <td className="px-4 py-3">GROSS SALARY</td>
                    <td className="px-4 py-3 text-right text-slate-500 font-normal">Basic + Allowances</td>
                    <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(payslip.gross)}</td>
                  </tr>

                  {breakdown['4_LOP_Deduction'] > 0 && (
                    <tr className="bg-rose-50/40 text-rose-700 hover:bg-rose-50/60 transition-colors">
                      <td className="px-4 py-3 font-medium">Loss of Pay (LOP)</td>
                      <td className="px-4 py-3 text-right text-rose-500">
                        {breakdown['4_LOP_Days']} unpaid leave day(s)
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">−{formatCurrency(breakdown['4_LOP_Deduction'])}</td>
                    </tr>
                  )}

                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-600">Income Tax / Provident Fund</td>
                    <td className="px-4 py-3 text-right text-slate-400">7% of Gross</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600">−{formatCurrency(breakdown['5_Income_Tax'] || payslip.gross * 0.07)}</td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-600">Social Security / Healthcare</td>
                    <td className="px-4 py-3 text-right text-slate-400">3% of Gross</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600">−{formatCurrency(breakdown['6_Social_Security'] || payslip.gross * 0.03)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Net Payable Highlight Card */}
              <div className="bg-[#714b67] text-white p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">TOTAL NET PAYABLE SALARY</span>
                  <span className="text-[10px] opacity-80 block">Gross Earnings − Total Deductions</span>
                </div>
                <span className="text-xl font-black">{formatCurrency(payslip.net)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-medium">
            Electronic Disbursement • PeoplePay360 Odoo ERP
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold border-0 cursor-pointer shadow-2xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
