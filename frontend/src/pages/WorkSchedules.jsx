import { useState } from 'react'
import {
  Clock, Calendar, CheckCircle2, Wifi, Cpu, Settings,
  Plus, AlertCircle, Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const weeklySchedule = [
  { day: 'Monday', work_type: 'Morning Shift', hours: '9:00 AM – 6:00 PM', lunch: '1:00 PM – 2:00 PM', total: '8.0 hrs', status: 'Working Day' },
  { day: 'Tuesday', work_type: 'Morning Shift', hours: '9:00 AM – 6:00 PM', lunch: '1:00 PM – 2:00 PM', total: '8.0 hrs', status: 'Working Day' },
  { day: 'Wednesday', work_type: 'Morning Shift', hours: '9:00 AM – 6:00 PM', lunch: '1:00 PM – 2:00 PM', total: '8.0 hrs', status: 'Working Day' },
  { day: 'Thursday', work_type: 'Morning Shift', hours: '9:00 AM – 6:00 PM', lunch: '1:00 PM – 2:00 PM', total: '8.0 hrs', status: 'Working Day' },
  { day: 'Friday', work_type: 'Morning Shift', hours: '9:00 AM – 6:00 PM', lunch: '1:00 PM – 2:00 PM', total: '8.0 hrs', status: 'Working Day' },
  { day: 'Saturday', work_type: 'Off', hours: '—', lunch: '—', total: '0.0 hrs', status: 'Weekend' },
  { day: 'Sunday', work_type: 'Off', hours: '—', lunch: '—', total: '0.0 hrs', status: 'Weekend' },
]

const biometricDevices = [
  { id: 'BIO-01', location: 'Main Entrance - Bangalore HQ', ip: '192.168.1.120', protocol: 'ZKEM / TCP', last_ping: 'Just now', status: 'Online' },
  { id: 'BIO-02', location: 'Server Room & Engineering Floor', ip: '192.168.1.125', protocol: 'ZKEM / TCP', last_ping: '1 min ago', status: 'Online' },
  { id: 'BIO-03', location: 'Operations & Logistics Hub', ip: '192.168.2.110', protocol: 'ZKEM / TCP', last_ping: '3 mins ago', status: 'Online' },
]

export default function WorkSchedules() {
  const [syncing, setSyncing] = useState(false)
  const [lastSyncText, setLastSyncText] = useState('2 minutes ago')

  const handleSyncNow = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      setLastSyncText('Just now')
    }, 1200)
  }

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Working Schedules & Biometrics</h1>
          <p className="text-xs text-slate-500">Standard working calendar shifts, grace periods, and hardware punch devices.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="teal"
            size="sm"
            onClick={handleSyncNow}
            disabled={syncing}
            className="gap-1.5"
          >
            <Wifi className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing Terminals...' : 'Sync Biometrics Now'}
          </Button>
          <Button className="gap-1.5 font-medium">
            <Plus className="h-3.5 w-3.5" /> New Schedule
          </Button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Default Standard Shift
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                40 Hours / Week
              </div>
              <span className="text-[11px] text-slate-500">5 Days Working · 2 Days Off</span>
            </div>
            <div className="p-2 rounded-lg bg-[#714b67]/10 text-[#714b67]">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Late Arrival Grace Period
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                15 Minutes
              </div>
              <span className="text-[11px] text-slate-500">Grace threshold before half-day flag</span>
            </div>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Connected Biometrics
              </span>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                3/3 Online
              </div>
              <span className="text-[11px] text-slate-500">Last poll: {lastSyncText}</span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Cpu className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Schedule Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Standard Working Calendar (General Shift)</h3>
            <p className="text-xs text-slate-500">Assigned to 84 full-time contracts</p>
          </div>
          <Badge variant="odoo">Default Calendar</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day of Week</TableHead>
              <TableHead>Shift Period</TableHead>
              <TableHead>Working Hours</TableHead>
              <TableHead>Lunch Break</TableHead>
              <TableHead>Paid Hours</TableHead>
              <TableHead className="text-right">Day Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeklySchedule.map((ws) => (
              <TableRow key={ws.day}>
                <TableCell className="font-semibold text-slate-900">{ws.day}</TableCell>
                <TableCell className="text-xs text-slate-600">{ws.work_type}</TableCell>
                <TableCell className="text-xs font-mono text-slate-700">{ws.hours}</TableCell>
                <TableCell className="text-xs font-mono text-slate-500">{ws.lunch}</TableCell>
                <TableCell className="text-xs font-mono font-medium text-slate-900">{ws.total}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={ws.status === 'Working Day' ? 'success' : 'muted'}>
                    {ws.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Biometric Hardware Terminals */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Biometric Devices & Hardware Terminals</h3>
            <p className="text-xs text-slate-500">Direct TCP/IP socket polling into Odoo Attendance model</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <Plus className="h-3 w-3" /> Register Terminal
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {biometricDevices.map((dev) => (
            <div key={dev.id} className="p-3.5 rounded-xl bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#714b67]">{dev.id}</span>
                <Badge variant="success" className="text-[10px] gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  {dev.status}
                </Badge>
              </div>
              <div className="text-xs font-medium text-slate-800">{dev.location}</div>
              <div className="text-[11px] text-slate-500 font-mono">
                IP: {dev.ip} · {dev.protocol}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
