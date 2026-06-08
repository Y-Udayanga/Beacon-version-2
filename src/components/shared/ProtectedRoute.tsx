import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth, type UserRole } from '@/lib/AuthContext'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

/**
 * Gate routes behind authentication and (optionally) specific roles.
 * - Unauthenticated users are sent to /login (preserving the attempted path).
 * - Suspended accounts are sent to /login with a flag.
 * - Authenticated users whose role isn't allowed are redirected to their home.
 */
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, role, status, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (status === 'suspended') {
    return <Navigate to="/login" state={{ suspended: true }} replace />
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Logged in but wrong role — send to their natural home.
    const home = role === 'dispatcher' ? '/dispatcher' : '/volunteer'
    // #region agent log
    fetch('http://127.0.0.1:7257/ingest/dafa2daa-a3c8-4b7b-8a30-6700e4bf18fe', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '610997' }, body: JSON.stringify({ sessionId: '610997', hypothesisId: 'HB', location: 'src/components/shared/ProtectedRoute.tsx', message: 'ROLE MISMATCH redirect', data: { path: location.pathname, role, allowedRoles, redirectingTo: home, loading, hasUser: !!user }, timestamp: Date.now() }) }).catch(() => {})
    // #endregion
    return <Navigate to={home} replace />
  }

  // #region agent log
  fetch('http://127.0.0.1:7257/ingest/dafa2daa-a3c8-4b7b-8a30-6700e4bf18fe', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '610997' }, body: JSON.stringify({ sessionId: '610997', hypothesisId: 'HB', location: 'src/components/shared/ProtectedRoute.tsx', message: 'access granted', data: { path: location.pathname, role, allowedRoles, loading, hasUser: !!user }, timestamp: Date.now() }) }).catch(() => {})
  // #endregion
  return <Outlet />
}
