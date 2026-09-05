import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FileText, Plus, Search, Calendar, DollarSign,
  ExternalLink, CheckCircle2, Shield
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Contracts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Maintain salary structures, wage rates, employment validity, and PF/ESI compliance.
          </p>
        </div>
        <Button className="gap-2 font-medium">
          <Plus className="h-4 w-4" /> New Contract
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/60 p-3 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ref, employee, or department..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['All', 'Active', 'Expired'].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className={`text-xs h-8 px-3 rounded-lg ${
                statusFilter === st ? 'bg-primary/15 text-primary border border-primary/20' : ''
              }`}
            >
              {st}
            </Button>
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
                <TableCell className="font-mono text-xs text-primary font-medium">
                  {c.contract_ref}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  <div>{c.employee}</div>
                  <span className="text-[11px] text-muted-foreground">{c.job_position} · {c.department}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.structure}</TableCell>
                <TableCell className="text-xs font-mono">{c.start_date}</TableCell>
                <TableCell className="text-xs font-mono">{c.end_date}</TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-foreground">
                  {formatCurrency(c.wage)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={c.status === 'Active' ? 'success' : 'danger'} className="text-[10px]">
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
