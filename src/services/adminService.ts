import { doc, getDoc } from 'firebase/firestore'
import { requireDb } from '../lib/firebase'

export async function getIsCurrentUserAdmin(uid: string) {
  const adminSnapshot = await getDoc(doc(requireDb(), 'admins', uid))
  return adminSnapshot.exists()
}
