import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'
import type { OAuthProviderId } from './authProviders'

export type AuthContextValue = {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  configurationError: string | null
  isAuthModalOpen: boolean
  authNotice: string | null
  pendingLinkInfo: { email: string; providerLabel: string } | null
  authVersion: number
  openAuthModal: () => void
  closeAuthModal: () => void
  signInWithGoogle: () => Promise<void>
  signInWithProvider: (providerId: OAuthProviderId) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (displayName: string, email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  linkPassword: (password: string) => Promise<void>
  linkProvider: (providerId: OAuthProviderId) => Promise<void>
  unlinkProvider: (method: 'google' | 'github' | 'password') => Promise<void>
  clearAuthNotice: () => void
  updateProfile: (displayName: string, photoURL: string | null) => Promise<void>
  needsUsername: boolean | null
  markUsernameSet: () => void
  sendVerificationEmail: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth musi być użyty wewnątrz AuthProvider.')
  }

  return context
}
