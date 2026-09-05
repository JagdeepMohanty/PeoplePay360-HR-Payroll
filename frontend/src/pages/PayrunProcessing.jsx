import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { computePayrun, validatePayrun, confirmPayrun } from '../api/payruns'
import GuardianWarningBanner from '../components/GuardianWarningBanner'
import { useState } from 'react'

export default function PayrunProcessing() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [warnings, setWarnings] = useState([])

  const { mutate: compute, isPending: computing } = useMutation({
    mutationFn: () => computePayrun(id),
    onSuccess: () => qc.invalidateQueries(['payruns']),
  })

  const { mutate: validate, isPending: validating } = useMutation({
    mutationFn: () => validatePayrun(id),
    onSuccess: (data) => setWarnings(data.warnings),
  })

  const { mutate: confirm, isPending: confirming } = useMutation({
    mutationFn: () => confirmPayrun(id),
    onSuccess: () => qc.invalidateQueries(['payruns']),
  })

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-800 mb-6">Payrun #{id} — Processing</h1>

      <GuardianWarningBanner warnings={warnings} />

      <div className="flex gap-3">
        <button onClick={() => compute()} disabled={computing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
          {computing ? 'Computing…' : '1. Compute'}
        </button>
        <button onClick={() => validate()} disabled={validating}
          className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 disabled:opacity-50">
          {validating ? 'Validating…' : '2. Run Guardian Checks'}
        </button>
        <button onClick={() => confirm()} disabled={confirming}
          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50">
          {confirming ? 'Confirming…' : '3. Confirm Payrun'}
        </button>
      </div>
    </div>
  )
}
