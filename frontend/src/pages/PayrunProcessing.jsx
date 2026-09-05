import { useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { computePayrun, validatePayrun, confirmPayrun } from '../api/payruns'
import { fetchPayslipDetail } from '../api/payrollAdapter'
import PayrollWarningBanner from '../components/payroll/warnings/PayrollWarningBanner'
import PayslipBreakdown from '../components/payroll/payslip/PayslipBreakdown'
import { useState, useEffect } from 'react'

export default function PayrunProcessing() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [warnings, setWarnings] = useState([])
  const [samplePayslip, setSamplePayslip] = useState(null)

  useEffect(() => {
    fetchPayslipDetail(101).then(data => setSamplePayslip(data))
  }, [id])

  const { mutate: compute, isPending: computing } = useMutation({
    mutationFn: () => computePayrun(id),
    onSuccess: () => qc.invalidateQueries(['payruns']),
  })

  const { mutate: validate, isPending: validating } = useMutation({
    mutationFn: () => validatePayrun(id),
    onSuccess: (data) => setWarnings(data?.warnings || []),
  })

  const { mutate: confirm, isPending: confirming } = useMutation({
    mutationFn: () => confirmPayrun(id),
    onSuccess: () => qc.invalidateQueries(['payruns']),
  })

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payrun #{id} — Processing & Execution</h1>
          <p className="text-xs text-gray-500 mt-0.5">3-Step Payrun Lifecycle: Compute → Guardian Validation → Final Confirmation</p>
        </div>
      </div>

      <PayrollWarningBanner warnings={warnings} />

      <div className="flex gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <button onClick={() => compute()} disabled={computing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {computing ? 'Computing…' : '1. Compute Payrun'}
        </button>
        <button onClick={() => validate()} disabled={validating}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors">
          {validating ? 'Validating…' : '2. Run Guardian Anomaly Checks'}
        </button>
        <button onClick={() => confirm()} disabled={confirming}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
          {confirming ? 'Confirming…' : '3. Confirm Payrun'}
        </button>
      </div>

      {samplePayslip && (
        <div>
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Itemized Payslip Preview</h2>
          <PayslipBreakdown
            payslip={samplePayslip}
            onDownloadPdf={(id) => alert(`Downloading PDF for payslip #${id}`)}
            onSendEmail={(id) => alert(`Sending email for payslip #${id}`)}
          />
        </div>
      )}
    </div>
  )
}
