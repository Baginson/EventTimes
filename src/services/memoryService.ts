import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { requireDb } from '../lib/firebase'

export const MAX_MEMORY_PHOTOS = 6

export type MemoryPhoto = {
  id: string
  url: string
  publicId?: string
  createdAt: string
}

export type EventMemory = {
  eventId: string
  venueId: string
  note: string
  photos: MemoryPhoto[]
  createdAt?: unknown
  updatedAt?: unknown
}


function validateEventMemory(memory: Omit<EventMemory, 'createdAt' | 'updatedAt'>) {
  if (memory.photos.length > MAX_MEMORY_PHOTOS) {
    throw new Error('Możesz dodać maksymalnie 6 zdjęć.')
  }

  if (memory.note.length > 2000) {
    throw new Error('Notatka może mieć maksymalnie 2000 znaków.')
  }
}

export async function getEventMemory(
  userId: string,
  eventId: string,
): Promise<EventMemory | null> {
  const memorySnapshot = await getDoc(
    doc(requireDb(), 'users', userId, 'eventMemories', eventId),
  )

  return memorySnapshot.exists() ? (memorySnapshot.data() as EventMemory) : null
}

export async function saveEventMemory(
  userId: string,
  memory: Omit<EventMemory, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  validateEventMemory(memory)

  const memoryReference = doc(requireDb(), 'users', userId, 'eventMemories', memory.eventId)
  const memorySnapshot = await getDoc(memoryReference)

  await setDoc(
    memoryReference,
    {
      ...memory,
      updatedAt: serverTimestamp(),
      ...(memorySnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
}

export async function deleteEventMemory(
  userId: string,
  eventId: string,
): Promise<void> {
  await deleteDoc(doc(requireDb(), 'users', userId, 'eventMemories', eventId))
}

export async function getAllEventMemories(userId: string): Promise<EventMemory[]> {
  const memorySnapshots = await getDocs(
    collection(requireDb(), 'users', userId, 'eventMemories'),
  )

  return memorySnapshots.docs.map((item) => item.data() as EventMemory)
}
