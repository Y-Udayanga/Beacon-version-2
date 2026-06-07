import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { AuthProvider } from '@/lib/AuthContext'
import ProtectedRoute from '@/components/shared/ProtectedRoute'

const Landing = lazy(() => import('./pages/Landing'))
const VictimApp = lazy(() => import('./pages/VictimApp'))
const DispatcherDashboard = lazy(() => import('./pages/DispatcherDashboard'))
const MissingPersonReport = lazy(() => import('./pages/MissingPersonReport'))
const MissingPersonsDashboard = lazy(() => import('./pages/MissingPersonsDashboard'))
const VolunteerView = lazy(() => import('./pages/VolunteerView'))
const ManageVolunteers = lazy(() => import('./pages/ManageVolunteers'))
const Login = lazy(() => import('./pages/Login'))

function LoadingScreen() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingScreen />}>
          <Routes location={location} key={location.pathname}>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/victim" element={<VictimApp />} />
            <Route path="/missing" element={<MissingPersonReport />} />
            <Route path="/missing-dashboard" element={<MissingPersonsDashboard />} />
            <Route path="/login" element={<Login />} />

            {/* Volunteer + dispatcher */}
            <Route element={<ProtectedRoute allowedRoles={['volunteer', 'dispatcher']} />}>
              <Route path="/volunteer" element={<VolunteerView />} />
            </Route>

            {/* Dispatcher only */}
            <Route element={<ProtectedRoute allowedRoles={['dispatcher']} />}>
              <Route path="/dispatcher" element={<DispatcherDashboard />} />
              <Route path="/volunteers" element={<ManageVolunteers />} />
            </Route>
          </Routes>
        </Suspense>
      </AnimatePresence>
    </AuthProvider>
  )
}
