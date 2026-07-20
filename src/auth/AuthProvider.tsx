import { FirebaseError } from 'firebase/app'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  unlink,
  updateProfile,
} from 'firebase/auth'
import type { AuthCredential, User } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { getIsCurrentUserAdmin } from '../services/adminService'
import { syncUserProfile, updateUserProfile } from '../services/userProfileService'
import { AuthContext } from './authContext'
import {
  createOAuthProvider,
  credentialFromOAuthError,
  getLinkedMethods,
  oauthProviderLabels,
} from './authProviders'
import type { OAuthProviderId } from './authProviders'
import { getAuthErrorMessage } from './authErrors'

let pendingLinkCredential: AuthCredential | null = null
let pendingLinkEmail: string | null = null
let pendingLinkProviderId: OAuthProviderId | null = null

const firebaseProviderIds = {
  google: 'google.com',
  github: 'github.com',
  password: 'password',
} as const

function getConfigurationError() {
  return 'Firebase nie jest skonfigurowany.'
}

function getErrorEmail(error: FirebaseError) {
  const email = error.customData?.email

  return typeof email === 'string' && email.trim() ? email.trim() : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [, setProfileVersion] = useState(0)
  const [authNotice, setAuthNotice] = useState<string | null>(null)
  const [pendingLinkInfo, setPendingLinkInfo] = useState<{
    email: string
    providerLabel: string
  } | null>(null)
  const [authVersion, setAuthVersion] = useState(0)
  const configurationError = isFirebaseConfigured
    ? null
    : 'Firebase nie jest skonfigurowany. Uzupełnij plik .env.local.'

  function bumpAuthVersion() {
    setAuthVersion((version) => version + 1)
  }

  function clearPendingLink() {
    pendingLinkCredential = null
    pendingLinkEmail = null
    pendingLinkProviderId = null
    setPendingLinkInfo(null)
  }

  function capturePendingLink(error: unknown, providerId: OAuthProviderId) {
    if (!(error instanceof FirebaseError)) {
      return false
    }

    if (error.code !== 'auth/account-exists-with-different-credential') {
      return false
    }

    const credential = credentialFromOAuthError(error)
    const email = getErrorEmail(error)

    if (!credential || !email) {
      return false
    }

    pendingLinkCredential = credential
    pendingLinkEmail = email
    pendingLinkProviderId = providerId
    setPendingLinkInfo({
      email,
      providerLabel: oauthProviderLabels[providerId],
    })

    return true
  }

  async function completePendingLink(nextUser: User) {
    if (!pendingLinkCredential || !pendingLinkEmail || !pendingLinkProviderId || !nextUser.email) {
      return
    }

    if (nextUser.email.toLowerCase() !== pendingLinkEmail.toLowerCase()) {
      return
    }

    const providerLabel = oauthProviderLabels[pendingLinkProviderId]

    try {
      await linkWithCredential(nextUser, pendingLinkCredential)
      clearPendingLink()
      bumpAuthVersion()
      setAuthNotice(
        `Połączono logowanie ${providerLabel} z Twoim kontem. Możesz teraz logować się obiema metodami.`,
      )
    } catch (error) {
      clearPendingLink()
      setAuthNotice(getAuthErrorMessage(error))
    }
  }

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

  async function signInWithProvider(providerId: OAuthProviderId) {
    if (!auth) {
      throw new Error(configurationError ?? getConfigurationError())
    }

    try {
      const credential = await signInWithPopup(auth, createOAuthProvider(providerId))
      await syncUserProfile(credential.user, providerId)
      await completePendingLink(credential.user)
      setIsAuthModalOpen(false)
    } catch (error) {
      capturePendingLink(error, providerId)
      throw error
    }
  }

  async function signInWithGoogle() {
    return signInWithProvider('google')
  }

  async function signInWithEmail(email: string, password: string) {
    if (!auth) {
      throw new Error(configurationError ?? getConfigurationError())
    }

    const credential = await signInWithEmailAndPassword(auth, email, password)
    await syncUserProfile(credential.user, 'password')
    await completePendingLink(credential.user)
    setIsAuthModalOpen(false)
  }

  async function registerWithEmail(displayName: string, email: string, password: string) {
    if (!auth) {
      throw new Error(configurationError ?? getConfigurationError())
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const normalizedName = displayName.trim()

    if (normalizedName) {
      await updateProfile(credential.user, { displayName: normalizedName })
    }

    await syncUserProfile(credential.user, 'password')
    setIsAuthModalOpen(false)
  }

  async function resetPassword(email: string) {
    if (!auth) {
      throw new Error(configurationError ?? getConfigurationError())
    }

    try {
      await sendPasswordResetEmail(auth, email.trim())
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'auth/user-not-found') {
        return
      }

      throw error
    }
  }

  async function linkPassword(password: string) {
    const currentUser = auth?.currentUser

    if (!currentUser) {
      throw new Error('Użytkownik nie jest zalogowany.')
    }

    if (!currentUser.email || !currentUser.emailVerified) {
      throw new Error('Twoje konto nie ma zweryfikowanego adresu e-mail — nie można ustawić hasła.')
    }

    await linkWithCredential(
      currentUser,
      EmailAuthProvider.credential(currentUser.email, password),
    )
    bumpAuthVersion()
  }

  async function linkProvider(providerId: OAuthProviderId) {
    const currentUser = auth?.currentUser

    if (!currentUser) {
      throw new Error('Użytkownik nie jest zalogowany.')
    }

    await linkWithPopup(currentUser, createOAuthProvider(providerId))
    bumpAuthVersion()
  }

  async function unlinkProvider(method: 'google' | 'github' | 'password') {
    const currentUser = auth?.currentUser

    if (!currentUser) {
      throw new Error('Użytkownik nie jest zalogowany.')
    }

    const linkedMethods = getLinkedMethods(currentUser)
    const linkedMethodCount = Object.values(linkedMethods).filter(Boolean).length

    if (linkedMethodCount <= 1 && linkedMethods[method]) {
      throw new Error('Nie można odłączyć ostatniej metody logowania.')
    }

    await unlink(currentUser, firebaseProviderIds[method])
    bumpAuthVersion()
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
        authNotice,
        pendingLinkInfo,
        authVersion,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        signInWithGoogle,
        signInWithProvider,
        signInWithEmail,
        registerWithEmail,
        resetPassword,
        linkPassword,
        linkProvider,
        unlinkProvider,
        clearAuthNotice: () => setAuthNotice(null),
        updateProfile: updateCurrentProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
