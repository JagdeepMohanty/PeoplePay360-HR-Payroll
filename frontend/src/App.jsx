import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'
import Contracts from './pages/Contracts'
import Attendance from './pages/Attendance'
import TimeOff from './pages/TimeOff'
import Payruns from './pages/Payruns'
import PayrunProcessing from './pages/PayrunProcessing'
import ProtectedRoute from './components/ProtectedRoute'
import EmployeeAccessModal from './components/EmployeeAccessModal'

function AppRoutes() {
  const { showAccessModal, setShowAccessModal } = useAuth()

  return (
    <>
      <EmployeeAccessModal isOpen={showAccessModal} onClose={() => setShowAccessModal(false)} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route
            path="employees"
            element={
              <ProtectedRoute permission="employee:view:all">
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees/:id"
            element={
              <ProtectedRoute permission="employee:view:own">
                <EmployeeDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="contracts"
            element={
              <ProtectedRoute permission="employee:view:all">
                <Contracts />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance"
            element={
              <ProtectedRoute permission="employee:view:own">
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="time-off"
            element={
              <ProtectedRoute permission="employee:view:own">
                <TimeOff />
              </ProtectedRoute>
            }
          />
          <Route path="leaves" element={<Navigate to="/time-off" replace />} />
          <Route path="timeoff" element={<Navigate to="/time-off" replace />} />
          <Route
            path="payruns"
            element={
              <ProtectedRoute permission="payroll:view:own">
                <Payruns />
              </ProtectedRoute>
            }
          />
          <Route path="payroll" element={<Navigate to="/payruns" replace />} />
          <Route
            path="payruns/:id/process"
            element={
              <ProtectedRoute permission="payroll:manage">
                <PayrunProcessing />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute permission="employee:view:all">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Wildcard Fallback prevents any 404 client route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
