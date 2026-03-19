import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { requestToken, revokeToken } from '@/lib/google/auth'
import type { TokenInfo } from '@/lib/google/auth'

interface AuthState {
  token: TokenInfo | null
  isAuthenticated: boolean
  signIn: () => Promise<void>
  signOut: () => void
  refreshToken: () => Promise<TokenInfo>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,

      signIn: async () => {
        const token = await requestToken()
        set({ token, isAuthenticated: true })
      },

      signOut: () => {
        const { token } = get()
        if (token) revokeToken(token.accessToken)
        set({ token: null, isAuthenticated: false })
      },

      refreshToken: async () => {
        const newToken = await requestToken()
        set({ token: newToken, isAuthenticated: true })
        return newToken
      },
    }),
    {
      name: 'wt-auth',
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
