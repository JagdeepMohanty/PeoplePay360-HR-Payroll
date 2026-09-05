import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Plus, LayoutGrid, List, Mail, Phone, Building2,
  ExternalLink, UserPlus, X, DollarSign
} from 'lucide-react'
import { usePayroll } from '@/context/PayrollContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'

export default function Employees() {
  const { employees, addEmployee, permissions, role } = usePayroll()
  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [viewMode, setViewMode] = useState('grid')

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newEmp, setNewEmp] = useState({
    name: '',
    work_email: '',
    work_phone: '',
    department: 'Engineering',
    job_position: '',
    manager_name: 'Priya Patel',
    contract_type: 'Full-time Permanent',
    wage: 85000,
  })

  const filtered = employees.filter((emp) => {
    // If employee only role, focus on own profile or all
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.job_position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.work_email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = deptFilter === 'All' || emp.department === deptFilter
    return matchesSearch && matchesDept
  })

  const departments = ['All', ...new Set(employees.map((e) => e.department).filter(Boolean))]

  const getInitials = (name) => {
    if (!name) return 'EM'
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase()
  }

  const handleCreateEmployee = (e) => {
    e.preventDefault()
    if (!newEmp.name.trim()) return

    addEmployee(newEmp)
    setIsAddModalOpen(false)
    setNewEmp({
      name: '',
      work_email: '',
      work_phone: '',
      department: 'Engineering',
      job_position: '',
      manager_name: 'Priya Patel',
      contract_type: 'Full-time Permanent',
      wage: 85000,
    })
  }

  return (
    <div className="space-y-4">
      {/* Top Action & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2.5">
          {permissions.canManageHR && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="gap-1.5 font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New Employee
            </Button>
          )}
          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} active records
          </span>
        </div>

        {/* Search & Views */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, role, email..."
              className="pl-8 h-8 text-xs bg-white shadow-xs"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg shrink-0">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={`h-7 w-7 rounded-md ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'}`}
              title="Kanban View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('table')}
              className={`h-7 w-7 rounded-md ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'}`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Department Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setDeptFilter(dept)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              deptFilter === dept
                ? 'bg-[#714b67] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 shadow-xs'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Content Rendering */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((emp) => (
            <Link key={emp.id} to={`/employees/${emp.id}`}>
              <Card className="hover:shadow-md transition-all h-full group">
                <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 border-0 shadow-xs shrink-0">
                        <AvatarFallback className="bg-[#714b67]/10 text-[#714b67] font-semibold text-xs">
                          {getInitials(emp.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-xs text-slate-900 truncate group-hover:text-[#714b67] transition-colors">
                          {emp.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate">{emp.job_position}</p>
                      </div>
                    </div>
                    <Badge
                      variant={emp.status === 'On Leave' ? 'warning' : 'success'}
                      className="text-[10px] shrink-0"
                    >
                      {emp.status || 'Active'}
                    </Badge>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-50 text-xs text-slate-500">
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.department || 'General'}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.work_email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border-0">
                        <AvatarFallback className="text-[10px] bg-[#714b67]/10 text-[#714b67]">
                          {getInitials(emp.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{emp.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{emp.department}</TableCell>
                  <TableCell className="text-slate-900 font-medium">{emp.job_position}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-[11px]">{emp.work_email}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={emp.status === 'On Leave' ? 'warning' : 'success'} className="text-[10px]">
                      {emp.status || 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/employees/${emp.id}`}>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        Open
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dynamic Add Employee Modal (B1) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Create a new master employee record and auto-generate their initial contract.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEmployee} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Full Name *</label>
              <Input
                required
                value={newEmp.name}
                onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="h-8 text-xs bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Department</label>
                <select
                  value={newEmp.department}
                  onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                  className="flex h-8 w-full rounded-lg border-0 bg-slate-100/90 px-2.5 py-1 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#714b67]/25"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Job Position *</label>
                <Input
                  required
                  value={newEmp.job_position}
                  onChange={(e) => setNewEmp({ ...newEmp, job_position: e.target.value })}
                  placeholder="e.g. Backend Engineer"
                  className="h-8 text-xs bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Work Email</label>
                <Input
                  type="email"
                  value={newEmp.work_email}
                  onChange={(e) => setNewEmp({ ...newEmp, work_email: e.target.value })}
                  placeholder="e.g. rahul@oxp.com"
                  className="h-8 text-xs bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Monthly Base Salary (₹) *</label>
                <Input
                  type="number"
                  required
                  value={newEmp.wage}
                  onChange={(e) => setNewEmp({ ...newEmp, wage: e.target.value })}
                  className="h-8 text-xs bg-slate-50 font-mono"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-7 text-xs">
                Save & Create Contract
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
