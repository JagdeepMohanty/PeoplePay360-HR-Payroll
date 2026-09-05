import { useState, useRef } from 'react'
import { X, Mail, CheckCircle2, Loader2, Send, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function BulkEmailModal({ payrun, onClose }) {
  const [sendState, setSendState] = useState({}) // { [employee]: 'pending' | 'sending' | 'sent' | 'error' }
  const [isRunning, setIsRunning] = useState(false)
  const cancelRef = useRef(false)

  const payslips = payrun?.payslips || []
  const sentCount = Object.values(sendState).filter(s => s === 'sent').length
  const totalCount = payslips.length
  const allDone = sentCount === totalCount && totalCount > 0

  const sendAll = async () => {
    cancelRef.current = false
    setIsRunning(true)

    // Mark all as pending first
    const initialState = {}
    payslips.forEach(ps => { initialState[ps.employee] = 'pending' })
    setSendState(initialState)

    // Stagger sends with realistic delay
    for (let i = 0; i < payslips.length; i++) {
      if (cancelRef.current) break
      const ps = payslips[i]

      // Mark as sending
      setSendState(prev => ({ ...prev, [ps.employee]: 'sending' }))
      await new Promise(r => setTimeout(r, 350 + Math.random() * 200))

      // Mark as sent
      setSendState(prev => ({ ...prev, [ps.employee]: 'sent' }))
    }
    setIsRunning(false)
  }

  const resendOne = async (empName) => {
    setSendState(prev => ({ ...prev, [empName]: 'sending' }))
    await new Promise(r => setTimeout(r, 600))
    setSendState(prev => ({ ...prev, [empName]: 'sent' }))
  }

  const getStatusIcon = (state) => {
    if (state === 'sending') return <Loader2 className="h-3.5 w-3.5 animate-spin text-[#714b67]" />
    if (state === 'sent')    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    return <Mail className="h-3.5 w-3.5 text-slate-300" />
  }

  const getStatusBadge = (state) => {
    if (state === 'sending') return <Badge variant="odoo" className="text-[10px] py-0">Sending…</Badge>
    if (state === 'sent')    return <Badge variant="success" className="text-[10px] py-0">Sent ✓</Badge>
    return <span className="text-[11px] text-slate-400">Queued</span>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border-0 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#714b67]/10 flex items-center justify-center">
              <Send className="h-4 w-4 text-[#714b67]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bulk Payslip Email Dispatch</h3>
              <p className="text-[11px] text-slate-500">{payrun?.name} — {totalCount} employees</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-medium">{allDone ? '✓ All payslips dispatched' : `${sentCount} of ${totalCount} sent`}</span>
              <span>{Math.round((sentCount / totalCount) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#714b67] to-[#00A09D] rounded-full transition-all duration-500"
                style={{ width: `${Math.round((sentCount / totalCount) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Payslip List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {payslips.map((ps) => (
            <div key={ps.employee} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                {getStatusIcon(sendState[ps.employee])}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{ps.employee}</p>
                  <p className="text-[11px] text-slate-400 truncate">{ps.email || `${ps.employee.toLowerCase().replace(/\s+/g, '.')}@oxp.com`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {getStatusBadge(sendState[ps.employee])}
                {sendState[ps.employee] === 'sent' && (
                  <button
                    onClick={() => resendOne(ps.employee)}
                    className="text-[10px] text-slate-400 hover:text-[#714b67] transition-colors underline underline-offset-2"
                  >
                    Resend
                  </button>
                )}
              </div>
            </div>
          ))}

          {totalCount === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No payslips in this payrun</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            {allDone
              ? 'All payslips have been dispatched to employee work emails.'
              : 'Payslips will be sent to each employee\'s registered work email.'}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="border-0 shadow-xs h-8 text-xs">
              {allDone ? 'Close' : 'Cancel'}
            </Button>
            {!allDone && (
              <Button
                size="sm"
                onClick={sendAll}
                disabled={isRunning || totalCount === 0}
                className="h-8 text-xs gap-1.5 shadow-xs"
              >
                {isRunning ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Dispatching…</>
                ) : (
                  <><Send className="h-3.5 w-3.5" /> Send All</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
