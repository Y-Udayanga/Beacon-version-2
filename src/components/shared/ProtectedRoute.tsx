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

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    const home = role === 'dispatcher' ? '/dispatcher' : '/volunteer'
    return <Navigate to={home} replace />
  }

  return <Outlet />
}
