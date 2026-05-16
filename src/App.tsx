import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'

const Landing = lazy(() => import('./pages/Landing'))
const VictimApp = lazy(() => import('./pages/VictimApp'))
const DispatcherDashboard = lazy(() => import('./pages/DispatcherDashboard'))
const MissingPersonReport = lazy(() => import('./pages/MissingPersonReport'))

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
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingScreen />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/victim" element={<VictimApp />} />
          <Route path="/dispatcher" element={<DispatcherDashboard />} />
          <Route path="/missing" element={<MissingPersonReport />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}
