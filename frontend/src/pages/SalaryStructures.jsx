import { useState } from 'react'
import {
  Sliders, Plus, Sparkles, CheckCircle2, FileText,
  Calculator, ChevronRight, ShieldCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const structures = [
  { id: 1, name: 'Regular Tech Band 4', code: 'TECH-B4', active_contracts: 34, rules_count: 8, base_percent: '50% Basic' },
  { id: 2, name: 'Executive HR Band 3', code: 'EXEC-HR3', active_contracts: 10, rules_count: 7, base_percent: '50% Basic' },
  { id: 3, name: 'Sales Base + Incentive', code: 'SALES-COMM', active_contracts: 22, rules_count: 9, base_percent: '40% Basic' },
  { id: 4, name: 'Operations Band 2', code: 'OPS-B2', active_contracts: 18, rules_count: 7, base_percent: '50% Basic' },
  { id: 5, name: 'Engineering Intern', code: 'ENG-INTERN', active_contracts: 8, rules_count: 3, base_percent: 'Stipend Flat' },
]

const salaryRules = [
  { code: 'BASIC', name: 'Basic Salary', category: 'Allowance', computation: 'Percentage (50% of Wage)', taxable: 'Yes', condition: 'Always True' },
  { code: 'HRA', name: 'House Rent Allowance', category: 'Allowance', computation: 'Percentage (40% of Basic)', taxable: 'Exempt up to limits', condition: 'City = Metro' },
  { code: 'SA', name: 'Special Allowance', category: 'Allowance', computation: 'Balancing Component', taxable: 'Yes', condition: 'Always True' },
  { code: 'PF_EE', name: 'Provident Fund (Employee)', category: 'Deduction', computation: '12% of (Basic + DA)', taxable: 'Tax Deductible 80C', condition: 'Wage > 15000' },
  { code: 'PF_ER', name: 'Provident Fund (Employer)', category: 'Company Contribution', computation: '12% of (Basic + DA)', taxable: 'No', condition: 'Always True' },
  { code: 'PT', name: 'Professional Tax', category: 'Deduction', computation: 'State Slab (₹200/month)', taxable: 'Yes', condition: 'State = Karnataka' },
  { code: 'TDS', name: 'Income Tax Deduction', category: 'Deduction', computation: 'New Tax Regime Slab', taxable: 'Variable', condition: 'Annual > 7,00,000' },
]

export default function SalaryStructures() {
  const [selectedStructure, setSelectedStructure] = useState(structures[0])

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Salary Structures & Rules</h1>
          <p className="text-xs text-slate-500">Configure compensation formulas, statutory PF/ESI rates, and tax deductions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Calculator className="h-3.5 w-3.5 text-[#714b67]" /> Simulate Formula
          </Button>
          <Button className="gap-1.5 font-medium">
            <Plus className="h-3.5 w-3.5" /> New Structure
          </Button>
        </div>
      </div>

      {/* Main Grid: Structure Selector + Rules Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Structures List */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Active Salary Structures ({structures.length})
          </h3>
          <div className="space-y-2">
            {structures.map((st) => (
              <Card
                key={st.id}
                onClick={() => setSelectedStructure(st)}
                className={`cursor-pointer transition-all ${
                  selectedStructure.id === st.id
                    ? 'ring-2 ring-[#714b67] bg-white'
                    : 'hover:bg-slate-50/70'
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 truncate">{st.name}</span>
                      <Badge variant="odoo" className="text-[10px] px-1.5 py-0">
                        {st.code}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>{st.active_contracts} Contracts</span>
                      <span>·</span>
                      <span>{st.rules_count} Rules</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Structure Detail & Rules Engine Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{selectedStructure.name}</h2>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Code: <span className="font-mono text-slate-700">{selectedStructure.code}</span> · Used in {selectedStructure.active_contracts} employee contracts
                </p>
              </div>
              <Button variant="teal" size="sm" className="text-xs gap-1">
                <Plus className="h-3 w-3" /> Add Salary Rule
              </Button>
            </div>

            {/* Rules Table */}
            <div className="pt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Computation Formula</TableHead>
                    <TableHead className="text-right">Taxable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryRules.map((r) => (
                    <TableRow key={r.code}>
                      <TableCell className="font-mono text-xs font-semibold text-[#714b67]">
                        {r.code}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {r.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.category === 'Allowance'
                              ? 'success'
                              : r.category === 'Deduction'
                              ? 'danger'
                              : 'odooTeal'
                          }
                          className="text-[10px]"
                        >
                          {r.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {r.computation}
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-500">
                        {r.taxable}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
