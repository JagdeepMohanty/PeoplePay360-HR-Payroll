import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPayrun } from '../api/payruns'
import { X } from 'lucide-react'

const INITIAL = { period_start: '', period_end: '', department: '' }

export default function PayrunWizardModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL)
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: createPayrun,
    onSuccess: () => { qc.invalidateQueries(['payruns']); onClose() },
  })

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800">Payrun Wizard — Step {step} of 2</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <label className="block text-sm">Period Start
              <input name="period_start" type="date" value={form.period_start} onChange={handleChange}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm">Period End
              <input name="period_end" type="date" value={form.period_end} onChange={handleChange}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </label>
            <button onClick={() => setStep(2)}
              className="w-full mt-2 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700">
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label className="block text-sm">Department (optional)
              <input name="department" value={form.department} onChange={handleChange}
                placeholder="All departments"
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </label>
            <p className="text-xs text-gray-500">
              Employees with active contracts in <strong>{form.period_start}</strong> → <strong>{form.period_end}</strong> will be included.
            </p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setStep(1)} className="flex-1 border py-2 rounded-md text-sm">← Back</button>
              <button onClick={() => mutate(form)} disabled={isPending}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
                {isPending ? 'Creating…' : 'Create Payrun'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
