import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

function ProtectedRoute({ allowedRoles, children }) {
  const { currentUser, getDashboardPath } = useApp()
  const location = useLocation()

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={getDashboardPath(currentUser.role)} replace />
  }

  return children
}

export default ProtectedRoute
