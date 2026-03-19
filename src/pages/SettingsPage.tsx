import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Trash2, LogOut, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSheetStore } from '@/store/sheetStore'
import { useAuthStore } from '@/store/authStore'
import { useNutritionStore } from '@/store/nutritionStore'
import type { MacroGoals } from '@/types/nutrition'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { sheetHistory, activeSheetId, activeSheetTitle, removeFromHistory, setActiveSheet, clearActiveSheet } = useSheetStore()
  const { isAuthenticated, signOut } = useAuthStore()
  const { macroGoals, setMacroGoals } = useNutritionStore()
  const [editMacros, setEditMacros] = useState(false)
  const [goals, setGoals] = useState<MacroGoals>(macroGoals)

  function saveMacros() {
    setMacroGoals(goals)
    setEditMacros(false)
  }

  function handleSignOut() {
    signOut()
    clearActiveSheet()
    navigate('/connect')
  }

  return (
    <div className="px-6 pb-10">
      <PageHeader title="Settings" />

      {/* Active sheet */}
      <div className="mb-10">
        <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Connected sheet</p>
        {activeSheetTitle && (
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <p className="text-sm font-medium">{activeSheetTitle}</p>
            <span className="text-xs text-neutral-400">active</span>
          </div>
        )}
        <button
          onClick={() => navigate('/connect')}
          className="flex items-center gap-2 text-sm text-neutral-400 mt-3"
        >
          Connect different sheet <ChevronRight size={14} />
        </button>
      </div>

      {/* Sheet history */}
      {sheetHistory.length > 1 && (
        <div className="mb-10">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Sheet history</p>
          <div className="space-y-0">
            {sheetHistory.map(meta => (
              <div key={meta.id} className="flex items-center justify-between py-3 border-b border-neutral-100">
                <button
                  className="flex-1 text-left"
                  onClick={() => {
                    setActiveSheet(meta)
                    navigate('/dashboard')
                  }}
                >
                  <p className={`text-sm ${meta.id === activeSheetId ? 'font-medium' : ''}`}>{meta.title}</p>
                </button>
                <button onClick={() => removeFromHistory(meta.id)} className="text-neutral-300 p-1 ml-2">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Macro goals */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-neutral-400 uppercase tracking-wider">Macro goals</p>
          <button onClick={() => setEditMacros(!editMacros)} className="text-xs text-neutral-400">
            {editMacros ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editMacros ? (
          <div className="space-y-3">
            {([['calories', 'Calories (kcal)'], ['proteinG', 'Protein (g)'], ['carbsG', 'Carbs (g)'], ['fatG', 'Fat (g)'], ['waterMl', 'Water (ml)']] as [keyof MacroGoals, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <p className="text-sm text-neutral-600">{label}</p>
                <input
                  type="number"
                  value={goals[key]}
                  onChange={e => setGoals({ ...goals, [key]: parseFloat(e.target.value) || 0 })}
                  className="text-sm font-medium border-b border-neutral-200 pb-1 outline-none w-20 text-right bg-transparent"
                />
              </div>
            ))}
            <button onClick={saveMacros} className="text-sm px-4 py-2 bg-black text-white rounded-lg mt-2">Save</button>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">{macroGoals.calories} kcal · {macroGoals.proteinG}g P · {macroGoals.carbsG}g C · {macroGoals.fatG}g F</p>
            <p className="text-sm text-neutral-600">{macroGoals.waterMl}ml water</p>
          </div>
        )}
      </div>

      {/* Body metrics link */}
      <div className="mb-10">
        <button
          onClick={() => navigate('/metrics')}
          className="flex items-center justify-between w-full py-3 border-b border-neutral-100"
        >
          <p className="text-sm">Body metrics</p>
          <ChevronRight size={16} className="text-neutral-400" />
        </button>
        <button
          onClick={() => navigate('/equipment')}
          className="flex items-center justify-between w-full py-3 border-b border-neutral-100"
        >
          <p className="text-sm">Equipment</p>
          <ChevronRight size={16} className="text-neutral-400" />
        </button>
      </div>

      {/* Account */}
      <div className="mb-6">
        <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Account</p>
        {isAuthenticated && (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-neutral-600"
          >
            <LogOut size={16} /> Sign out of Google
          </button>
        )}
      </div>

      <p className="text-xs text-neutral-300">
        Your data is stored in your Google Sheet. This app has no servers.
      </p>
    </div>
  )
}
