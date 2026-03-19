import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import ConnectPage from './pages/ConnectPage'
import DashboardPage from './pages/DashboardPage'
import WorkoutPage from './pages/WorkoutPage'
import HistoryPage from './pages/HistoryPage'
import ProgramsPage from './pages/ProgramsPage'
import ProgramEditorPage from './pages/ProgramEditorPage'
import NutritionPage from './pages/NutritionPage'
import MetricsPage from './pages/MetricsPage'
import SettingsPage from './pages/SettingsPage'
import { useSheetStore } from './store/sheetStore'
import { useAuthStore } from './store/authStore'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const isAuth = useAuthStore(s => s.isAuthenticated)
  const sheetId = useSheetStore(s => s.activeSheetId)

  useEffect(() => {
    if (!isAuth || !sheetId) {
      navigate('/connect', { replace: true })
    }
  }, [isAuth, sheetId, navigate])

  if (!isAuth || !sheetId) return null
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
        <Route path="programs" element={<ProgramsPage />} />
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
