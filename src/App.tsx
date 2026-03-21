import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import ConnectPage from './pages/ConnectPage'
import DashboardPage from './pages/DashboardPage'
import WorkoutPage from './pages/WorkoutPage'
import HistoryPage from './pages/HistoryPage'
import ProgramEditorPage from './pages/ProgramEditorPage'
import NutritionPage from './pages/NutritionPage'
import MetricsPage from './pages/MetricsPage'
import SettingsPage from './pages/SettingsPage'
import { useSheetStore } from './store/sheetStore'
import { useAuthStore } from './store/authStore'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const isAuth = useAuthStore(s => s.isAuthenticated)
  const token = useAuthStore(s => s.token)
  const signOut = useAuthStore(s => s.signOut)
  const sheetId = useSheetStore(s => s.activeSheetId)

  // Token expiry check: if the stored token is expired, sign out immediately
  // instead of letting sheetsApi try a background refresh (which opens a popup
  // that gets blocked on mobile/PWA, causing an infinite loading state).
  const tokenExpired = isAuth && (token === null || token.expiresAt <= Date.now())

  useEffect(() => {
    if (tokenExpired) signOut()
  }, [tokenExpired, signOut])

  useEffect(() => {
    if (!isAuth || !sheetId || tokenExpired) {
      navigate('/connect', { replace: true })
    }
  }, [isAuth, sheetId, tokenExpired, navigate])

  if (!isAuth || !sheetId || tokenExpired) return null
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/connect" element={<ConnectPage />} />
      <Route path="/" element={<AuthGuard><AppShell /></AuthGuard>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="workout" element={<WorkoutPage />} />
        <Route path="workout/history" element={<HistoryPage />} />
        <Route path="programs" element={<Navigate to="/workout" replace />} />
        <Route path="programs/new" element={<ProgramEditorPage />} />
        <Route path="programs/:programId" element={<ProgramEditorPage />} />
        <Route path="nutrition" element={<NutritionPage />} />
        <Route path="metrics" element={<MetricsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/connect" replace />} />
    </Routes>
  )
}
