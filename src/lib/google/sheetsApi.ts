import { useAuthStore } from '@/store/authStore'
import { HEADERS, TABS } from './sheetSchema'

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3/files'

async function getToken(): Promise<string> {
  const { token, refreshToken } = useAuthStore.getState()
  if (token && token.expiresAt > Date.now() + 60_000) {
    return token.accessToken
  }
  const newToken = await refreshToken()
  return newToken.accessToken
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const accessToken = await getToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sheets API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function getSpreadsheetMeta(sheetId: string): Promise<{ title: string }> {
  const data = await request<{ properties: { title: string } }>(
    `${BASE}/${sheetId}?fields=properties.title`
  )
  return { title: data.properties.title }
}

export async function getRange(sheetId: string, range: string): Promise<string[][]> {
  const data = await request<{ values?: string[][] }>(
    `${BASE}/${sheetId}/values/${encodeURIComponent(range)}`
  )
  return data.values ?? []
}

export async function batchGet(sheetId: string, ranges: string[]): Promise<Record<string, string[][]>> {
  const params = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&')
  const data = await request<{ valueRanges: { range: string; values?: string[][] }[] }>(
    `${BASE}/${sheetId}/values:batchGet?${params}`
  )
  const result: Record<string, string[][]> = {}
  for (const vr of data.valueRanges ?? []) {
    // extract sheet name from range like "'Sheet1'!A1:Z"
    const match = vr.range.match(/^'?([^'!]+)'?!/)
    const key = match ? match[1] : vr.range
    result[key] = vr.values ?? []
  }
  return result
}

export async function appendRow(sheetId: string, tab: string, row: string[]): Promise<void> {
  await request(
    `${BASE}/${sheetId}/values/${encodeURIComponent(tab)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: JSON.stringify({ values: [row] }),
    }
  )
}

export async function updateRow(sheetId: string, range: string, row: string[]): Promise<void> {
  await request(
    `${BASE}/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      body: JSON.stringify({ values: [row] }),
    }
  )
}

export async function deleteRow(sheetId: string, sheetDbId: number, rowIndex: number): Promise<void> {
  await request(`${BASE}/${sheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheetDbId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          }
        }
      }]
    })
  })
}

export async function clearRange(sheetId: string, range: string): Promise<void> {
  await request(`${BASE}/${sheetId}/values/${encodeURIComponent(range)}:clear`, {
    method: 'POST',
  })
}

export async function batchUpdateValues(sheetId: string, updates: { range: string; values: string[][] }[]): Promise<void> {
  await request(`${BASE}/${sheetId}/values:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: updates,
    }),
  })
}

// Initialize sheet with all required tabs and headers
export async function initializeSheet(sheetId: string): Promise<void> {
  // Get existing sheets
  const meta = await request<{ sheets: { properties: { title: string; sheetId: number } }[] }>(
    `${BASE}/${sheetId}?fields=sheets.properties`
  )
  const existingTabs = new Set(meta.sheets.map(s => s.properties.title))
  const requiredTabs = Object.values(TABS)
  const missingTabs = requiredTabs.filter(t => !existingTabs.has(t))

  if (missingTabs.length === 0) return

  // Create missing tabs
  const addRequests = missingTabs.map(title => ({
    addSheet: { properties: { title } }
  }))
  await request(`${BASE}/${sheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests: addRequests }),
  })

  // Add headers to new tabs
  const headerUpdates = missingTabs.map(tab => ({
    range: `${tab}!A1`,
    values: [HEADERS[tab]],
  }))
  await batchUpdateValues(sheetId, headerUpdates)
}

export async function getSheetInternalIds(sheetId: string): Promise<Record<string, number>> {
  const meta = await request<{ sheets: { properties: { title: string; sheetId: number } }[] }>(
    `${BASE}/${sheetId}?fields=sheets.properties`
  )
  const result: Record<string, number> = {}
  for (const s of meta.sheets) {
    result[s.properties.title] = s.properties.sheetId
  }
  return result
}

export async function getDriveFileName(fileId: string): Promise<string> {
  const data = await request<{ name: string }>(`${DRIVE_BASE}/${fileId}?fields=name`)
  return data.name
}
