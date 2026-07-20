import { FirebaseError } from 'firebase/app'
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth'
import type { AuthCredential, AuthProvider, User } from 'firebase/auth'

export type OAuthProviderId = 'google' | 'github'

export const oauthProviderLabels: Record<OAuthProviderId, string> = {
  google: 'Google',
  github: 'GitHub',
}

export function createOAuthProvider(id: OAuthProviderId): AuthProvider {
  if (id === 'google') {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    return provider
  }

  const provider = new GithubAuthProvider()
  provider.addScope('user:email')
  return provider
}

export function credentialFromOAuthError(error: FirebaseError): AuthCredential | null {
  const credentialReaders = [
    GoogleAuthProvider.credentialFromError,
    GithubAuthProvider.credentialFromError,
    OAuthProvider.credentialFromError,
  ]

  for (const readCredential of credentialReaders) {
    try {
      const credential = readCredential(error)

      if (credential) {
        return credential
      }
    } catch {
      // Some Firebase provider helpers only understand their own error shape.
    }
  }

  return null
}

export function getLinkedMethods(user: User) {
  const providerIds = new Set(user.providerData.map((provider) => provider.providerId))

  return {
    google: providerIds.has('google.com'),
    github: providerIds.has('github.com'),
    password: providerIds.has('password'),
  }
}
