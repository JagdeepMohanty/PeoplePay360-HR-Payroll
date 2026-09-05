import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import client from '../api/client'

const mockContracts = [
  { id: 1, contract_ref: 'CNT-2023-001', employee: 'Aarav Sharma', department: 'Engineering', job_position: 'Tech Lead', start_date: '2023-01-12', end_date: 'Open-ended', wage: 175000, structure: 'Regular Tech Band 4', status: 'Active' },
  { id: 2, contract_ref: 'CNT-2023-014', employee: 'Priya Patel', department: 'HR', job_position: 'HR Manager', start_date: '2023-04-01', end_date: 'Open-ended', wage: 125000, structure: 'Executive HR Band 3', status: 'Active' },
  { id: 3, contract_ref: 'CNT-2024-008', employee: 'Rohan Verma', department: 'Sales', job_position: 'Account Executive', start_date: '2024-02-15', end_date: 'Open-ended', wage: 95000, structure: 'Sales Base + Incentive', status: 'Active' },
  { id: 4, contract_ref: 'CNT-2024-022', employee: 'Ananya Iyer', department: 'Engineering', job_position: 'Frontend Engineer', start_date: '2024-06-01', end_date: 'Open-ended', wage: 110000, structure: 'Regular Tech Band 2', status: 'Active' },
  { id: 5, contract_ref: 'CNT-2025-003', employee: 'Vikram Singh', department: 'Operations', job_position: 'Operations Specialist', start_date: '2025-01-10', end_date: '2026-12-31', wage: 85000, structure: 'Operations Band 2', status: 'Active' },
  { id: 6, contract_ref: 'CNT-2025-019', employee: 'Sneha Reddy', department: 'Marketing', job_position: 'Growth Lead', start_date: '2025-03-01', end_date: 'Open-ended', wage: 120000, structure: 'Marketing Band 3', status: 'Active' },
  { id: 7, contract_ref: 'CNT-2022-045', employee: 'Rajesh Kumar', department: 'Engineering', job_position: 'DevOps Architect', start_date: '2022-08-01', end_date: '2026-07-31', wage: 190000, structure: 'Regular Tech Band 5', status: 'Expired' },
]

export default function Contracts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const { data: contractsData } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      try {
        const res = await client.get('/api/v1/contracts')
        return res?.data?.length ? res.data : mockContracts
      } catch {
        return mockContracts
      }
    },
    initialData: mockContracts,
  })

  const records = contractsData || mockContracts

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

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Contracts</h1>
          <p className="text-xs text-slate-500">Employment terms, wage components, and validity periods.</p>
        </div>
        <Button className="gap-1.5 font-medium shadow-xs">
          <Plus className="h-3.5 w-3.5" /> New Contract
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ref or employee..."
            className="pl-8 h-8 text-xs bg-white shadow-xs"
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
      <Card className="p-0 overflow-hidden">
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
    </div>
  )
}
