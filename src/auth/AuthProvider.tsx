import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { getIsCurrentUserAdmin } from '../services/adminService'
import { syncUserProfile, updateUserProfile } from '../services/userProfileService'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [, setProfileVersion] = useState(0)
  const configurationError = isFirebaseConfigured
    ? null
    : 'Firebase nie jest skonfigurowany. Uzupełnij plik .env.local.'

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    let active = true

    setIsAdmin(false)

    if (!user) {
      return () => {
        active = false
      }
    }

    void getIsCurrentUserAdmin(user.uid)
      .then((nextIsAdmin) => {
        if (active) {
          setIsAdmin(nextIsAdmin)
        }
      })
      .catch(() => {
        if (active) {
          setIsAdmin(false)
        }
      })

    return () => {
      active = false
    }
  }, [user])

  async function signInWithGoogle() {
    if (!auth) {
      throw new Error(configurationError ?? 'Firebase nie jest skonfigurowany.')
    }

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const credential = await signInWithPopup(auth, provider)
    await syncUserProfile(credential.user, 'google')
    setIsAuthModalOpen(false)
  }

  async function signInWithEmail(email: string, password: string) {
    if (!auth) {
      throw new Error(configurationError ?? 'Firebase nie jest skonfigurowany.')
    }

    const credential = await signInWithEmailAndPassword(auth, email, password)
    await syncUserProfile(credential.user, 'password')
    setIsAuthModalOpen(false)
  }

  async function registerWithEmail(displayName: string, email: string, password: string) {
    if (!auth) {
      throw new Error(configurationError ?? 'Firebase nie jest skonfigurowany.')
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const normalizedName = displayName.trim()

    if (normalizedName) {
      await updateProfile(credential.user, { displayName: normalizedName })
    }

    await syncUserProfile(credential.user, 'password')
    setIsAuthModalOpen(false)
  }

  async function logout() {
    if (auth) {
      await signOut(auth)
    }
  }

  async function updateCurrentProfile(displayName: string, photoURL: string | null) {
    if (!user) {
      throw new Error('Użytkownik nie jest zalogowany.')
    }

    await updateUserProfile(user, displayName, photoURL)
    setProfileVersion((version) => version + 1)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin,
        configurationError,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        updateProfile: updateCurrentProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
