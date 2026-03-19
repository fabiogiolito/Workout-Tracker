export interface SheetMeta {
  id: string
  url: string
  title: string
  lastUsedAt: string
}

export interface SheetConnection {
  sheetId: string | null
  status: 'idle' | 'connecting' | 'connected' | 'error'
  error: string | null
}
