import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

function requireDb() {
  if (!db) {
    throw new Error('Firebase Firestore nie jest skonfigurowany.')
  }

  return db
}

export async function getIsCurrentUserAdmin(uid: string) {
  const adminSnapshot = await getDoc(doc(requireDb(), 'admins', uid))
  return adminSnapshot.exists()
}
