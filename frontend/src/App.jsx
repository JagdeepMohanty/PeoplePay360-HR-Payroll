import { Routes, Route, Navigate } from 'react-router-dom'
import { PayrollProvider } from './context/PayrollContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'
import Contracts from './pages/Contracts'
import Attendance from './pages/Attendance'
import TimeOff from './pages/TimeOff'
import Payruns from './pages/Payruns'
import PayrunProcessing from './pages/PayrunProcessing'
import PayslipReport from './pages/PayslipReport'
import SalaryStructures from './pages/SalaryStructures'
import WorkSchedules from './pages/WorkSchedules'

export default function App() {
  return (
    <PayrollProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="time-off" element={<TimeOff />} />
          <Route path="timeoff" element={<Navigate to="/time-off" replace />} />
          <Route path="schedules" element={<WorkSchedules />} />
          <Route path="structures" element={<SalaryStructures />} />
          <Route path="payruns" element={<Payruns />} />
          <Route path="payruns/:id/process" element={<PayrunProcessing />} />
          <Route path="payruns/:id/report" element={<PayslipReport />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </PayrollProvider>
  )
}
