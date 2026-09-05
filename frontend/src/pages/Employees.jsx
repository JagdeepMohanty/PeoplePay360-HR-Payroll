import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Search, Plus, LayoutGrid, List, Mail, Phone, Building2,
  ExternalLink, UserCheck, Shield
} from 'lucide-react'
import { getEmployees } from '../api/employees'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const fallbackEmployees = [
  { id: 1, name: 'Aarav Sharma', department: 'Engineering', job_position: 'Tech Lead', work_email: 'aarav.sharma@oxp.com', work_phone: '+91 98765 43210', status: 'Active' },
  { id: 2, name: 'Priya Patel', department: 'HR', job_position: 'HR Manager', work_email: 'priya.patel@oxp.com', work_phone: '+91 98765 43211', status: 'Active' },
  { id: 3, name: 'Rohan Verma', department: 'Sales', job_position: 'Account Executive', work_email: 'rohan.verma@oxp.com', work_phone: '+91 98765 43212', status: 'Active' },
  { id: 4, name: 'Ananya Iyer', department: 'Engineering', job_position: 'Frontend Engineer', work_email: 'ananya.iyer@oxp.com', work_phone: '+91 98765 43213', status: 'Active' },
  { id: 5, name: 'Vikram Singh', department: 'Operations', job_position: 'Operations Specialist', work_email: 'vikram.singh@oxp.com', work_phone: '+91 98765 43214', status: 'On Leave' },
  { id: 6, name: 'Sneha Reddy', department: 'Marketing', job_position: 'Growth Lead', work_email: 'sneha.reddy@oxp.com', work_phone: '+91 98765 43215', status: 'Active' },
]

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [viewMode, setViewMode] = useState('grid')

  const { data: apiEmployees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        const res = await getEmployees()
        return res?.data?.length ? res.data : fallbackEmployees
      } catch (err) {
        return fallbackEmployees
      }
    },
    initialData: fallbackEmployees,
  })

  const employees = apiEmployees || fallbackEmployees

  const filtered = employees.filter((emp) => {
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
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage employee master profiles, active assignments, and departments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2 font-medium">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filter and View Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/60 p-3 rounded-xl border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, role, or email..."
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Dept Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {departments.map((dept) => (
              <Button
                key={dept}
                variant={deptFilter === dept ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDeptFilter(dept)}
                className={`text-xs h-8 px-3 rounded-lg ${
                  deptFilter === dept ? 'bg-primary/15 text-primary border border-primary/20' : ''
                }`}
              >
                {dept}
              </Button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border shrink-0">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-7 w-7 rounded-md"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('table')}
              className="h-7 w-7 rounded-md"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <Link key={emp.id} to={`/employees/${emp.id}`}>
              <Card className="hover:border-primary/50 transition-all group h-full">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {getInitials(emp.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {emp.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{emp.job_position}</p>
                      </div>
                    </div>
                    <Badge
                      variant={emp.status === 'On Leave' ? 'warning' : 'success'}
                      className="text-[10px] shrink-0"
                    >
                      {emp.status || 'Active'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                      <span className="truncate">{emp.department || 'General'}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
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
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(emp.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{emp.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{emp.department}</TableCell>
                  <TableCell className="text-foreground">{emp.job_position}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{emp.work_email}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={emp.status === 'On Leave' ? 'warning' : 'success'} className="text-[10px]">
                      {emp.status || 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/employees/${emp.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                        View Profile <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
