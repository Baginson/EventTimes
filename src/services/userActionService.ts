import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import type { EventTimesEvent } from '../data/mockEvents'
import { db } from '../lib/firebase'

export type EventActionKey = 'interested' | 'going' | 'visited' | 'saved'

export type EventAction = {
  eventId: string
  venueId: string
  interested: boolean
  going: boolean
  visited: boolean
  saved: boolean
  updatedAt?: unknown
}

export type VenueAction = {
  venueId: string
  saved: boolean
  updatedAt?: unknown
}

const emptyEventAction = (event: EventTimesEvent): EventAction => ({
  eventId: event.id,
  venueId: event.venueId,
  interested: false,
  going: false,
  visited: false,
  saved: false,
})

function requireDb() {
  if (!db) {
    throw new Error('Firebase nie jest skonfigurowany.')
  }

  return db
}

export async function getEventAction(uid: string, event: EventTimesEvent) {
  const actionSnapshot = await getDoc(
    doc(requireDb(), 'users', uid, 'eventActions', event.id),
  )

  return actionSnapshot.exists()
    ? ({ ...emptyEventAction(event), ...actionSnapshot.data() } as EventAction)
    : emptyEventAction(event)
}

export async function toggleEventAction(
  uid: string,
  event: EventTimesEvent,
  key: EventActionKey,
  currentAction: EventAction,
) {
  const nextAction = { ...currentAction, [key]: !currentAction[key] }

  await setDoc(
    doc(requireDb(), 'users', uid, 'eventActions', event.id),
    { ...nextAction, eventId: event.id, venueId: event.venueId, updatedAt: serverTimestamp() },
    { merge: true },
  )

  return nextAction
}

export async function getVenueAction(uid: string, venueId: string) {
  const actionSnapshot = await getDoc(
    doc(requireDb(), 'users', uid, 'venueActions', venueId),
  )

  return actionSnapshot.exists()
    ? ({ venueId, saved: false, ...actionSnapshot.data() } as VenueAction)
    : { venueId, saved: false }
}

export async function toggleVenueSaved(uid: string, venueId: string, saved: boolean) {
  const nextAction: VenueAction = { venueId, saved: !saved }

  await setDoc(
    doc(requireDb(), 'users', uid, 'venueActions', venueId),
    { ...nextAction, updatedAt: serverTimestamp() },
    { merge: true },
  )

  return nextAction
}

export async function getAllUserActions(uid: string) {
  const database = requireDb()
  const [eventSnapshots, venueSnapshots] = await Promise.all([
    getDocs(collection(database, 'users', uid, 'eventActions')),
    getDocs(collection(database, 'users', uid, 'venueActions')),
  ])

  return {
    eventActions: eventSnapshots.docs.map((item) => item.data() as EventAction),
    venueActions: venueSnapshots.docs.map((item) => item.data() as VenueAction),
  }
}

export async function clearAllUserActions(uid: string) {
  const database = requireDb()
  const [eventSnapshots, venueSnapshots] = await Promise.all([
    getDocs(collection(database, 'users', uid, 'eventActions')),
    getDocs(collection(database, 'users', uid, 'venueActions')),
  ])
  const references = [
    ...eventSnapshots.docs.map((item) => item.ref),
    ...venueSnapshots.docs.map((item) => item.ref),
  ]

  for (let index = 0; index < references.length; index += 450) {
    const batch = writeBatch(database)
    references.slice(index, index + 450).forEach((reference) => batch.delete(reference))
    await batch.commit()
  }
}
