/// <reference types="google.accounts" />

// Extend window type for Google Identity Services
declare global {
  interface Window {
    google: typeof google
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ')

export interface TokenInfo {
  accessToken: string
  expiresAt: number // timestamp ms
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null
let tokenResolve: ((token: TokenInfo) => void) | null = null
let tokenReject: ((err: Error) => void) | null = null

function initTokenClient() {
  if (tokenClient) return
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error) {
        tokenReject?.(new Error(response.error))
      } else {
        const info: TokenInfo = {
          accessToken: response.access_token,
          expiresAt: Date.now() + (Number(response.expires_in ?? 3600)) * 1000,
        }
        tokenResolve?.(info)
      }
      tokenResolve = null
      tokenReject = null
    },
  })
}

export function requestToken(hint?: string): Promise<TokenInfo> {
  return new Promise((resolve, reject) => {
    initTokenClient()
    tokenResolve = resolve
    tokenReject = reject
    tokenClient!.requestAccessToken({ hint })
  })
}

export function revokeToken(accessToken: string): void {
  window.google.accounts.oauth2.revoke(accessToken, () => {})
}

export function isGoogleLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.google?.accounts?.oauth2
}
