import { updateProfile } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export type UserProvider = 'google' | 'password'

export async function syncUserProfile(user: User, provider: UserProvider) {
  if (!db) {
    return
  }

  const profileRef = doc(db, 'users', user.uid)
  const existingProfile = await getDoc(profileRef)

  await setDoc(
    profileRef,
    {
      uid: user.uid,
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      provider,
      ...(existingProfile.exists() ? {} : { createdAt: serverTimestamp() }),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function updateUserProfile(
  user: User,
  displayName: string,
  photoURL: string | null,
) {
  if (!db) {
    throw new Error('Firebase nie jest skonfigurowany.')
  }

  await updateProfile(user, { displayName, photoURL })
  await setDoc(
    doc(db, 'users', user.uid),
    {
      displayName,
      photoURL,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
