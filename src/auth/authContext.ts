import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthContextValue = {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  configurationError: string | null
  isAuthModalOpen: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (displayName: string, email: string, password: string) => Promise<void>
  updateProfile: (displayName: string, photoURL: string | null) => Promise<void>
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
