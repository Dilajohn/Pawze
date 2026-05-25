import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext.jsx'
import Header from './components/layout/Header.jsx'
import Footer from './components/layout/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import PublicBookingPage from './pages/booking/PublicBookingPage.jsx'
import AdminDashboard from './pages/dashboards/AdminDashboard.jsx'
import GroomerDashboard from './pages/dashboards/GroomerDashboard.jsx'
import CustomerDashboard from './pages/dashboards/CustomerDashboard.jsx'

function RoleHomeRedirect() {
  const { currentUser, getDashboardPath } = useApp()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getDashboardPath(currentUser.role)} replace />
}

function AppFrame() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)', color: 'var(--text-body)' }}>
      <Header />
      <main className={isLanding ? '' : 'pt-24'}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/book" element={<PublicBookingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Role redirect */}
          <Route path="/dashboard" element={<RoleHomeRedirect />} />

          {/* Protected — admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected — groomer */}
          <Route
            path="/groomer"
            element={
              <ProtectedRoute allowedRoles={['groomer']}>
                <GroomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected — customer */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppFrame />
    </AppProvider>
  )
}

export default App
