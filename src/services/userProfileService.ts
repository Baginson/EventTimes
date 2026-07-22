import { updateProfile } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, requireDb } from '../lib/firebase'

export type UserProvider = 'google' | 'github' | 'password'

export type UserPreferences = {
  defaultCity: string
  eventTypes: string[]
}

export type UserProfileSettings = {
  profileSetupCompleted: boolean
  username: string | null
  userPreferences: UserPreferences
}

export const defaultUserPreferences: UserPreferences = {
  defaultCity: 'Leszno',
  eventTypes: [],
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

function normalizeUserProfileSettings(data: Record<string, unknown> | undefined): UserProfileSettings {
  const rawPreferences = data?.userPreferences
  const preferences = rawPreferences && typeof rawPreferences === 'object'
    ? rawPreferences as Record<string, unknown>
    : {}
  const defaultCity =
    typeof preferences.defaultCity === 'string' && preferences.defaultCity.trim()
      ? preferences.defaultCity.trim()
      : typeof data?.defaultCity === 'string' && data.defaultCity.trim()
        ? data.defaultCity.trim()
        : defaultUserPreferences.defaultCity

  return {
    profileSetupCompleted: data?.profileSetupCompleted === true,
    username: typeof data?.username === 'string' && data.username.trim()
      ? data.username.trim().toLowerCase()
      : null,
    userPreferences: {
      defaultCity,
      eventTypes: Array.from(new Set(normalizeStringArray(preferences.eventTypes))),
    },
  }
}

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
  const database = requireDb()

  await updateProfile(user, { displayName, photoURL })
  await setDoc(
    doc(database, 'users', user.uid),
    {
      displayName,
      photoURL,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function getUserProfileSettings(uid: string) {
  const profileSnapshot = await getDoc(doc(requireDb(), 'users', uid))

  return normalizeUserProfileSettings(
    profileSnapshot.exists()
      ? profileSnapshot.data()
      : undefined,
  )
}

export async function saveUserProfileSettings(
  uid: string,
  userPreferences: UserPreferences,
  profileSetupCompleted = true,
) {
  const normalizedPreferences = {
    defaultCity: userPreferences.defaultCity.trim() || defaultUserPreferences.defaultCity,
    eventTypes: Array.from(new Set(userPreferences.eventTypes.filter(Boolean))),
  }

  await setDoc(
    doc(requireDb(), 'users', uid),
    {
      defaultCity: normalizedPreferences.defaultCity,
      profileSetupCompleted,
      userPreferences: normalizedPreferences,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return {
    profileSetupCompleted,
    username: null,
    userPreferences: normalizedPreferences,
  } satisfies UserProfileSettings
}

export async function saveUsernameToProfile(uid: string, username: string) {
  await setDoc(
    doc(requireDb(), 'users', uid),
    {
      username,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
