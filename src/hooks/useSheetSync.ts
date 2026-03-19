import { useCallback, useEffect, useRef, useState } from 'react'
import { useSheetStore } from '@/store/sheetStore'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/lib/google/sheetsApi'

export function useSheetData<T>(
  tabName: string,
  parser: (rows: string[][]) => T,
  onLoad: (data: T) => void,
  deps: unknown[] = []
) {
  const sheetId = useSheetStore(s => s.activeSheetId)
  const isAuth = useAuthStore(s => s.isAuthenticated)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!sheetId || !isAuth) return
    setIsLoading(true)
    setError(null)
    try {
      const rows = await api.getRange(sheetId, `${tabName}!A:Z`)
      onLoad(parser(rows))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId, isAuth, tabName, ...deps])

  useEffect(() => { load() }, [load])

  return { isLoading, error, reload: load }
}

// Write queue for reliable async writes
const writeQueue: Array<() => Promise<void>> = []
let isProcessing = false

async function processQueue() {
  if (isProcessing || writeQueue.length === 0) return
  isProcessing = true
  while (writeQueue.length > 0) {
    const task = writeQueue.shift()!
    try { await task() } catch (e) { console.error('Write error:', e) }
  }
  isProcessing = false
}

export function queueWrite(fn: () => Promise<void>) {
  writeQueue.push(fn)
  processQueue()
}

export function useAppendRow(tabName: string) {
  const sheetId = useSheetStore(s => s.activeSheetId)
  return useCallback((row: string[]) => {
    if (!sheetId) return
    queueWrite(() => api.appendRow(sheetId, tabName, row))
  }, [sheetId, tabName])
}

export function useUpdateConfig() {
  const sheetId = useSheetStore(s => s.activeSheetId)
  const pending = useRef<Record<string, string>>({})
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  return useCallback((key: string, value: string) => {
    if (!sheetId) return
    pending.current[key] = value
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const updates = { ...pending.current }
      pending.current = {}
      // Read existing config, update matching rows
      try {
        const rows = await api.getRange(sheetId, 'Config!A:C')
        const now = new Date().toISOString()
        const batchUpdates: { range: string; values: string[][] }[] = []
        for (const [k, v] of Object.entries(updates)) {
          const rowIdx = rows.findIndex(r => r[0] === k)
          if (rowIdx >= 0) {
            batchUpdates.push({ range: `Config!A${rowIdx + 1}:C${rowIdx + 1}`, values: [[k, v, now]] })
          } else {
            await api.appendRow(sheetId, 'Config', [k, v, now])
          }
        }
        if (batchUpdates.length > 0) {
          await api.batchUpdateValues(sheetId, batchUpdates)
        }
      } catch (e) { console.error('Config update failed:', e) }
    }, 500)
  }, [sheetId])
}
