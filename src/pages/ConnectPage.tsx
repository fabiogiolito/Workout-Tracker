import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Trash2, ChevronRight, Loader2 } from 'lucide-react'
import { useSheetStore } from '@/store/sheetStore'
import { useAuthStore } from '@/store/authStore'
import { parseSheetId } from '@/lib/google/sheetSchema'
import { getSpreadsheetMeta, initializeSheet } from '@/lib/google/sheetsApi'
import { isGoogleLoaded } from '@/lib/google/auth'
import { formatDate } from '@/lib/utils/formatters'
import type { SheetMeta } from '@/types/sheet'

export default function ConnectPage() {
  const navigate = useNavigate()
  const { sheetHistory, setActiveSheet, removeFromHistory, setConnectionStatus } = useSheetStore()
  const { isAuthenticated, signIn } = useAuthStore()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleReady, setGoogleReady] = useState(isGoogleLoaded())

  useEffect(() => {
    if (isGoogleLoaded()) { setGoogleReady(true); return }
    const interval = setInterval(() => {
      if (isGoogleLoaded()) { setGoogleReady(true); clearInterval(interval) }
    }, 200)
    return () => clearInterval(interval)
  }, [])

  async function connect(sheetUrl: string) {
    const id = parseSheetId(sheetUrl)
    if (!id) { setError('Invalid Google Sheets URL'); return }

    setLoading(true)
    setError('')
    try {
      if (!isAuthenticated) await signIn()
      const meta = await getSpreadsheetMeta(id)
      setConnectionStatus('connecting')
      await initializeSheet(id)
      const sheetMeta: SheetMeta = {
        id, url: sheetUrl, title: meta.title, lastUsedAt: new Date().toISOString()
      }
      setActiveSheet(sheetMeta)
      navigate('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed')
      setConnectionStatus('error', String(e))
    } finally {
      setLoading(false)
    }
  }

  async function switchSheet(meta: SheetMeta) {
    setLoading(true)
    setError('')
    try {
      if (!isAuthenticated) await signIn()
      await initializeSheet(meta.id)
      setActiveSheet(meta)
      navigate('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col px-6 pt-16 pb-10 max-w-md mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Workout Tracker</h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          Your data lives in your own Google Sheet.<br />
          Paste a sheet link to get started.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        <input
          type="text"
          value={url}
          onChange={e => { setUrl(e.target.value); setError('') }}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="w-full text-sm border-b border-neutral-200 pb-3 outline-none placeholder:text-neutral-300 focus:border-black transition-colors bg-transparent"
        />
        {error && <p className="text-xs text-neutral-500">{error}</p>}
        <button
          onClick={() => connect(url.trim())}
          disabled={!url.trim() || loading || !googleReady}
          className="flex items-center gap-2 text-sm font-medium disabled:opacity-40 transition-opacity"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Connecting…</>
          ) : (
            <><ArrowRight size={16} /> Connect sheet</>
          )}
        </button>
        {!googleReady && (
          <p className="text-xs text-neutral-400">Loading Google…</p>
        )}
      </div>

      {sheetHistory.length > 0 && (
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Recent sheets</p>
          <div className="space-y-0">
            {sheetHistory.map(meta => (
              <div key={meta.id} className="flex items-center justify-between py-4 border-b border-neutral-100 last:border-0">
                <button
                  className="flex-1 flex items-center justify-between text-left"
                  onClick={() => switchSheet(meta)}
                  disabled={loading}
                >
                  <div>
                    <p className="text-sm font-medium">{meta.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{formatDate(meta.lastUsedAt)}</p>
                  </div>
                  <ChevronRight size={16} className="text-neutral-300 ml-3" />
                </button>
                <button
                  onClick={() => removeFromHistory(meta.id)}
                  className="ml-3 text-neutral-300 hover:text-neutral-600 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-8">
        <p className="text-xs text-neutral-300 leading-relaxed">
          A Google authorization popup will appear to access your sheet securely. No data leaves your account.
        </p>
      </div>
    </div>
  )
}
