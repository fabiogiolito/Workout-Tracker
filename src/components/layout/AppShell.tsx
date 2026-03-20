import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Dumbbell, LayoutDashboard, BookOpen, Apple, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/formatters'

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/workout', icon: Dumbbell, label: 'Workout' },
  { path: '/programs', icon: BookOpen, label: 'Programs' },
  { path: '/nutrition', icon: Apple, label: 'Nutrition' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-1 overflow-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}>
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 flex items-center justify-around px-2 pt-2 z-40" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}>
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path || location.pathname.startsWith(path + '/')
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-0 flex-1',
                active ? 'text-black' : 'text-neutral-400'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2 : 1.5} />
              <span className={cn('text-[10px] font-medium', active ? 'font-semibold' : '')}>{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
