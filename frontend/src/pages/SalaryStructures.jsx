import { useState } from 'react'
import { Plus, Sparkles, Calculator, ChevronRight, Trash2, Edit3, X, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePayroll } from '@/context/PayrollContext'

const CATEGORIES = ['Allowance', 'Deduction', 'Company Contribution']
const COMPUTATIONS = [
  { value: 'percent_of_gross',  label: '% of Gross Wage' },
  { value: 'percent_of_rule',   label: '% of Another Rule' },
  { value: 'fixed',             label: 'Fixed Amount (₹)' },
  { value: 'balance',           label: 'Balancing Component' },
  { value: 'slab_pt',           label: 'Professional Tax Slab' },
  { value: 'tds_new_regime',    label: 'TDS (New Tax Regime)' },
]

const RULE_CODES = ['BASIC', 'HRA', 'DA', 'SA', 'INCENT', 'PF_EE', 'PT', 'TDS', 'ESI', 'PF_ER']

function categoryBadgeVariant(cat) {
  if (cat === 'Allowance') return 'success'
  if (cat === 'Deduction') return 'danger'
  return 'odooTeal'
}

function computationLabel(rule) {
  switch (rule.computation) {
    case 'percent_of_gross': return `${(rule.pct * 100).toFixed(0)}% of Gross`
    case 'percent_of_rule':  return `${(rule.pct * 100).toFixed(0)}% of ${rule.source}`
    case 'fixed':            return `₹${rule.amount?.toLocaleString('en-IN')} flat`
    case 'balance':          return 'Balancing component'
    case 'slab_pt':          return 'State PT slab'
    case 'tds_new_regime':   return 'TDS — New Tax Regime'
    default:                 return rule.computation
  }
}

export default function SalaryStructures() {
  const {
    salaryStructures, addSalaryStructure, addSalaryRule, updateSalaryRule, deleteSalaryRule,
    permissions, computePayslip, showToast
  } = usePayroll()

  const [selectedId, setSelectedId] = useState(salaryStructures[0]?.id)
  const [showAddRule, setShowAddRule]         = useState(false)
  const [showNewStruct, setShowNewStruct]     = useState(false)
  const [showSimulate, setShowSimulate]       = useState(false)
  const [simulateWage, setSimulateWage]       = useState(100000)
  const [simulateResult, setSimulateResult]   = useState(null)
  const [editingRuleCode, setEditingRuleCode] = useState(null)
  const [editPct, setEditPct]                 = useState('')

  const [newRule, setNewRule] = useState({
    code: '', name: '', category: 'Allowance',
    computation: 'percent_of_gross', pct: 0.5,
    source: 'BASIC', amount: 0, taxable: true,
  })
  const [newStruct, setNewStruct] = useState({ name: '', code: '', base_percent_label: '50% Basic' })

  const selected = salaryStructures.find(s => s.id === selectedId) || salaryStructures[0]

  const handleSimulate = () => {
    if (!selected) return
    const result = computePayslip(Number(simulateWage), selected.rules)
    setSimulateResult(result)
  }

  const handleAddRule = () => {
    if (!newRule.code || !newRule.name) return
    addSalaryRule(selected.id, { ...newRule, pct: Number(newRule.pct), amount: Number(newRule.amount) })
    setShowAddRule(false)
    setNewRule({ code: '', name: '', category: 'Allowance', computation: 'percent_of_gross', pct: 0.5, source: 'BASIC', amount: 0, taxable: true })
  }

  const handleSaveRuleEdit = (ruleCode) => {
    updateSalaryRule(selected.id, ruleCode, { pct: Number(editPct) / 100 })
    setEditingRuleCode(null)
  }

  const handleAddStruct = () => {
    if (!newStruct.name || !newStruct.code) return
    addSalaryStructure(newStruct)
    setShowNewStruct(false)
    setNewStruct({ name: '', code: '', base_percent_label: '50% Basic' })
  }

  const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Salary Structures &amp; Rules</h1>
          <p className="text-xs text-slate-500">Configure compensation formulas, statutory PF/ESI rates, and tax deductions. Changes affect next payrun computation.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs shadow-xs border-0"
            onClick={() => setShowSimulate(!showSimulate)}>
            <Calculator className="h-3.5 w-3.5 text-[#714b67]" /> Simulate
          </Button>
          {permissions.canConfigureRules && (
            <Button size="sm" className="gap-1.5 font-medium shadow-xs" onClick={() => setShowNewStruct(true)}>
              <Plus className="h-3.5 w-3.5" /> New Structure
            </Button>
          )}
        </div>
      </div>

      {/* Salary Formula Simulator */}
      {showSimulate && selected && (
        <Card className="p-5 border-0 bg-purple-50/40">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-[#714b67]" />
            <h3 className="text-sm font-bold text-slate-900">Formula Simulator — {selected.name}</h3>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 max-w-xs">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Monthly Gross Wage (₹)</label>
              <Input
                type="number"
                value={simulateWage}
                onChange={e => setSimulateWage(e.target.value)}
                className="h-8 text-xs border-0 bg-white"
              />
            </div>
            <Button size="sm" onClick={handleSimulate} className="mt-4 shadow-xs">
              <Calculator className="h-3.5 w-3.5 mr-1" /> Compute
            </Button>
          </div>

          {simulateResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {simulateResult.lineItems.map(li => (
                <div key={li.code} className={`rounded-xl p-3 ${li.category === 'Allowance' ? 'bg-emerald-50' : li.category === 'Deduction' ? 'bg-rose-50' : 'bg-teal-50'}`}>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{li.code}</p>
                  <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">{formatCurrency(li.amount)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{li.name}</p>
                </div>
              ))}
              <div className="col-span-2 sm:col-span-4 grid grid-cols-3 gap-3 mt-1">
                <div className="rounded-xl bg-emerald-100 p-3">
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase">Total Earnings</p>
                  <p className="text-base font-extrabold text-emerald-800 mt-0.5">{formatCurrency(simulateResult.totalAllowances)}</p>
                </div>
                <div className="rounded-xl bg-rose-100 p-3">
                  <p className="text-[10px] font-semibold text-rose-700 uppercase">Total Deductions</p>
                  <p className="text-base font-extrabold text-rose-800 mt-0.5">{formatCurrency(simulateResult.totalDeductions)}</p>
                </div>
                <div className="rounded-xl bg-[#714b67]/10 p-3">
                  <p className="text-[10px] font-semibold text-[#714b67] uppercase">Net Payable</p>
                  <p className="text-base font-extrabold text-[#714b67] mt-0.5">{formatCurrency(simulateResult.netPayable)}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Structure List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Structures ({salaryStructures.length})
          </h3>
          {salaryStructures.map(st => (
            <Card
              key={st.id}
              onClick={() => setSelectedId(st.id)}
              className={`cursor-pointer transition-all border-0 ${
                selectedId === st.id ? 'bg-purple-50/70 shadow-sm' : 'bg-white hover:bg-slate-50/70'
              }`}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 truncate">{st.name}</span>
                    <Badge variant="odoo" className="text-[10px] px-1.5 py-0 shrink-0">{st.code}</Badge>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {st.rules.filter(r => r.category === 'Allowance').length} Earnings · {st.rules.filter(r => r.category === 'Deduction').length} Deductions
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rules Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <Card className="p-5 border-0">
              <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{selected.name}</h2>
                    <Badge variant="success" className="text-[10px]">Active</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Code: <span className="font-mono text-slate-700">{selected.code}</span>
                    &nbsp;·&nbsp;{selected.rules.length} Rules&nbsp;·&nbsp;
                    Salary rules drive payslip computation in real-time
                  </p>
                </div>
                {permissions.canConfigureRules && (
                  <Button variant="teal" size="sm" className="text-xs gap-1 shadow-xs" onClick={() => setShowAddRule(true)}>
                    <Plus className="h-3 w-3" /> Add Rule
                  </Button>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Formula</TableHead>
                    {permissions.canConfigureRules && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...selected.rules].sort((a, b) => a.sequence - b.sequence).map(r => (
                    <TableRow key={r.code}>
                      <TableCell className="font-mono text-xs font-semibold text-[#714b67]">{r.code}</TableCell>
                      <TableCell className="font-medium text-slate-900 text-xs">{r.name}</TableCell>
                      <TableCell>
                        <Badge variant={categoryBadgeVariant(r.category)} className="text-[10px]">{r.category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {editingRuleCode === r.code ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editPct}
                              onChange={e => setEditPct(e.target.value)}
                              className="h-6 w-20 text-xs border-0 bg-slate-100"
                              placeholder="%"
                            />
                            <span className="text-slate-400 text-xs">%</span>
                            <button onClick={() => handleSaveRuleEdit(r.code)} className="text-emerald-500 hover:text-emerald-700">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setEditingRuleCode(null)} className="text-slate-400 hover:text-slate-600">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono">{computationLabel(r)}</span>
                        )}
                      </TableCell>
                      {permissions.canConfigureRules && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(r.computation === 'percent_of_gross' || r.computation === 'percent_of_rule') && (
                              <button
                                onClick={() => { setEditingRuleCode(r.code); setEditPct(String(Math.round(r.pct * 100))) }}
                                className="p-1 text-slate-400 hover:text-[#714b67] transition-colors"
                                title="Edit percentage"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteSalaryRule(selected.id, r.code)}
                              className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                              title="Remove rule"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border-0 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add Salary Rule to {selected?.name}</h3>
              <button onClick={() => setShowAddRule(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Rule Code *</label>
                  <select
                    value={newRule.code}
                    onChange={e => setNewRule(p => ({ ...p, code: e.target.value }))}
                    className="w-full text-xs rounded-lg bg-slate-50 p-2 text-slate-800 border-0 focus:ring-2 focus:ring-[#714b67]/30 h-8"
                  >
                    <option value="">Select code</option>
                    {RULE_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Rule Name *</label>
                  <Input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} className="h-8 text-xs bg-slate-50 border-0" placeholder="e.g. Basic Salary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                  <select value={newRule.category} onChange={e => setNewRule(p => ({ ...p, category: e.target.value }))} className="w-full text-xs rounded-lg bg-slate-50 p-2 text-slate-800 border-0 h-8">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Computation</label>
                  <select value={newRule.computation} onChange={e => setNewRule(p => ({ ...p, computation: e.target.value }))} className="w-full text-xs rounded-lg bg-slate-50 p-2 text-slate-800 border-0 h-8">
                    {COMPUTATIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {(newRule.computation === 'percent_of_gross' || newRule.computation === 'percent_of_rule') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Percentage (%)</label>
                    <Input type="number" value={Math.round(newRule.pct * 100)} onChange={e => setNewRule(p => ({ ...p, pct: Number(e.target.value) / 100 }))} className="h-8 text-xs bg-slate-50 border-0" />
                  </div>
                  {newRule.computation === 'percent_of_rule' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Based on Rule</label>
                      <select value={newRule.source} onChange={e => setNewRule(p => ({ ...p, source: e.target.value }))} className="w-full text-xs rounded-lg bg-slate-50 p-2 text-slate-800 border-0 h-8">
                        {RULE_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {newRule.computation === 'fixed' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Fixed Amount (₹)</label>
                  <Input type="number" value={newRule.amount} onChange={e => setNewRule(p => ({ ...p, amount: Number(e.target.value) }))} className="h-8 text-xs bg-slate-50 border-0" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowAddRule(false)} className="border-0 shadow-xs">Cancel</Button>
              <Button size="sm" onClick={handleAddRule} className="shadow-xs">Add Rule</Button>
            </div>
          </div>
        </div>
      )}

      {/* New Structure Modal */}
      {showNewStruct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border-0 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">New Salary Structure</h3>
              <button onClick={() => setShowNewStruct(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Structure Name *</label>
                <Input value={newStruct.name} onChange={e => setNewStruct(p => ({ ...p, name: e.target.value }))} className="h-8 text-xs bg-slate-50 border-0" placeholder="e.g. Engineering Senior Band" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Short Code *</label>
                <Input value={newStruct.code} onChange={e => setNewStruct(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="h-8 text-xs bg-slate-50 border-0 font-mono" placeholder="e.g. ENG-SR" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowNewStruct(false)} className="border-0 shadow-xs">Cancel</Button>
              <Button size="sm" onClick={handleAddStruct} className="shadow-xs">Create Structure</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
