import { useState } from 'react'
import { Plus, Search, FileText, CheckCircle2, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePayroll } from '../context/PayrollContext'

export default function Contracts() {
  const { contracts, employees, addContract, permissions } = usePayroll()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [newForm, setNewForm] = useState({
    employee: '',
    department: 'Engineering',
    job_position: 'Specialist',
    wage: 85000,
    structure: 'Regular Tech Band 4',
    start_date: new Date().toISOString().split('T')[0],
    end_date: 'Open-ended',
  })

  const records = contracts || []

  const filtered = records.filter((c) => {
    const matchesSearch =
      c.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contract_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.department?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    if (!newForm.employee) return
    addContract(newForm)
    setShowModal(false)
    setNewForm({
      employee: '',
      department: 'Engineering',
      job_position: 'Specialist',
      wage: 85000,
      structure: 'Regular Tech Band 4',
      start_date: new Date().toISOString().split('T')[0],
      end_date: 'Open-ended',
    })
  }

  const handleSelectEmployee = (empName) => {
    const found = employees.find(e => e.name === empName)
    if (found) {
      setNewForm(prev => ({
        ...prev,
        employee: found.name,
        department: found.department,
        job_position: found.job_position,
        wage: found.wage || 85000,
      }))
    } else {
      setNewForm(prev => ({ ...prev, employee: empName }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Contracts</h1>
          <p className="text-xs text-slate-500">Employment terms, wage components, and validity periods.</p>
        </div>
        {permissions.canManageHR && (
          <Button onClick={() => setShowModal(true)} className="gap-1.5 font-medium shadow-xs">
            <Plus className="h-3.5 w-3.5" /> New Contract
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ref or employee..."
            className="pl-8 h-8 text-xs bg-white shadow-xs border-0"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['All', 'Active', 'Expired'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-[#714b67] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 shadow-xs'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Table */}
      <Card className="p-0 overflow-hidden border-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract Ref</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Salary Structure</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="text-right">Monthly Base Wage</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs text-[#714b67] font-semibold">
                  {c.contract_ref}
                </TableCell>
                <TableCell className="font-semibold text-slate-900">
                  <div>{c.employee}</div>
                  <span className="text-[10px] text-slate-400 font-normal">{c.job_position} · {c.department}</span>
                </TableCell>
                <TableCell className="text-xs text-slate-600">{c.structure}</TableCell>
                <TableCell className="text-xs font-mono text-slate-600">{c.start_date}</TableCell>
                <TableCell className="text-xs font-mono text-slate-600">{c.end_date}</TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-slate-900">
                  {formatCurrency(c.wage)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={c.status === 'Active' ? 'success' : 'danger'}>
                    {c.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* New Contract Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border-0 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#714b67]/10 flex items-center justify-center text-[#714b67]">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Generate Employment Contract</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Employee *</label>
                <select
                  value={newForm.employee}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="w-full text-xs rounded-lg bg-slate-50 p-2.5 text-slate-800 border-0 focus:ring-2 focus:ring-[#714b67]/30"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
                  <Input
                    value={newForm.department}
                    onChange={(e) => setNewForm(prev => ({ ...prev, department: e.target.value }))}
                    className="h-8 text-xs bg-slate-50 border-0"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Job Position</label>
                  <Input
                    value={newForm.job_position}
                    onChange={(e) => setNewForm(prev => ({ ...prev, job_position: e.target.value }))}
                    className="h-8 text-xs bg-slate-50 border-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Monthly Wage (₹) *</label>
                  <Input
                    type="number"
                    value={newForm.wage}
                    onChange={(e) => setNewForm(prev => ({ ...prev, wage: e.target.value }))}
                    className="h-8 text-xs bg-slate-50 border-0"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Salary Structure</label>
                  <select
                    value={newForm.structure}
                    onChange={(e) => setNewForm(prev => ({ ...prev, structure: e.target.value }))}
                    className="w-full text-xs rounded-lg bg-slate-50 p-2 text-slate-800 border-0 focus:ring-2 focus:ring-[#714b67]/30 h-8"
                  >
                    <option value="Regular Tech Band 4">Regular Tech Band 4</option>
                    <option value="Executive HR Band 3">Executive HR Band 3</option>
                    <option value="Sales Base + Incentive">Sales Base + Incentive</option>
                    <option value="Operations Band 2">Operations Band 2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={newForm.start_date}
                    onChange={(e) => setNewForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="h-8 text-xs bg-slate-50 border-0"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">End Date</label>
                  <Input
                    value={newForm.end_date}
                    onChange={(e) => setNewForm(prev => ({ ...prev, end_date: e.target.value }))}
                    placeholder="Open-ended or YYYY-MM-DD"
                    className="h-8 text-xs bg-slate-50 border-0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="border-0 shadow-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="shadow-xs">
                  Create Contract
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
