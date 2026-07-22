import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { mockEvents } from '../data/mockEvents'
import type { EventTimesEvent } from '../data/mockEvents'
import { isMediaImage } from '../features/media/mediaModel'
import { db } from '../lib/firebase'

const EVENTS_STORAGE_KEY = 'event-times.events.v1'
const EVENTS_COLLECTION = 'events'

function cloneStarterEvents(): EventTimesEvent[] {
  return mockEvents.map((event) => ({ ...event }))
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string'
}

function isExternalIds(value: unknown): value is EventTimesEvent['externalIds'] {
  if (value === undefined) {
    return true
  }

  if (!value || typeof value !== 'object') {
    return false
  }

  const externalIds = value as EventTimesEvent['externalIds']
  return isOptionalString(externalIds?.ticketmaster)
}

function isMediaImages(value: unknown): value is EventTimesEvent['images'] {
  return value === undefined || (Array.isArray(value) && value.every(isMediaImage))
}

function isEvent(value: unknown): value is EventTimesEvent {
  if (!value || typeof value !== 'object') {
    return false
  }

  const event = value as Partial<EventTimesEvent>

  return (
    typeof event.id === 'string' &&
    typeof event.venueId === 'string' &&
    (typeof event.name === 'string' || typeof event.title === 'string') &&
    (typeof event.eventType === 'string' || typeof event.category === 'string') &&
    typeof event.description === 'string' &&
    typeof event.startDate === 'string' &&
    isOptionalString(event.endDate) &&
    isOptionalString(event.startTime) &&
    isOptionalString(event.endTime) &&
    isOptionalString(event.ticketUrl) &&
    isOptionalString(event.sourceUrl) &&
    isOptionalString(event.imageUrl) &&
    isOptionalString(event.title) &&
    isOptionalString(event.slug) &&
    isOptionalString(event.category) &&
    isMediaImages(event.images) &&
    isExternalIds(event.externalIds)
  )
}

function normalizeEvent(value: unknown, fallbackId: string): EventTimesEvent {
  const event = value && typeof value === 'object' ? (value as Partial<EventTimesEvent>) : {}

  return {
    id: typeof event.id === 'string' && event.id.trim() ? event.id.trim() : fallbackId,
    venueId: typeof event.venueId === 'string' ? event.venueId : '',
    name:
      typeof event.name === 'string'
        ? event.name
        : typeof event.title === 'string'
          ? event.title
          : '',
    title: typeof event.title === 'string' ? event.title : undefined,
    slug: typeof event.slug === 'string' ? event.slug : undefined,
    eventType:
      typeof event.eventType === 'string'
        ? event.eventType
        : typeof event.category === 'string'
          ? event.category
          : 'Inne',
    category: typeof event.category === 'string' ? event.category : undefined,
    description: typeof event.description === 'string' ? event.description : '',
    startDate: typeof event.startDate === 'string' ? event.startDate : '',
    endDate: typeof event.endDate === 'string' ? event.endDate : undefined,
    startTime: typeof event.startTime === 'string' ? event.startTime : undefined,
    endTime: typeof event.endTime === 'string' ? event.endTime : undefined,
    ticketUrl: typeof event.ticketUrl === 'string' ? event.ticketUrl : undefined,
    sourceUrl: typeof event.sourceUrl === 'string' ? event.sourceUrl : undefined,
    imageUrl: typeof event.imageUrl === 'string' ? event.imageUrl : undefined,
    images: isMediaImages(event.images) ? event.images : undefined,
    organizer: typeof event.organizer === 'string' ? event.organizer : undefined,
    isPromoted: typeof event.isPromoted === 'boolean' ? event.isPromoted : undefined,
    externalIds: isExternalIds(event.externalIds) ? event.externalIds : undefined,
    createdAt: typeof event.createdAt === 'string' ? event.createdAt : undefined,
    updatedAt: typeof event.updatedAt === 'string' ? event.updatedAt : undefined,
  }
}

function withWriteTimestamps(event: EventTimesEvent, isCreate: boolean): EventTimesEvent {
  const now = new Date().toISOString()

  return {
    ...event,
    createdAt: isCreate ? event.createdAt ?? now : event.createdAt,
    updatedAt: now,
  }
}

function toFirestoreData(event: EventTimesEvent) {
  return JSON.parse(JSON.stringify(event)) as EventTimesEvent
}

function persistEventsLocally(events: EventTimesEvent[]) {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
}

export function getLocalEvents(): EventTimesEvent[] {
  if (typeof localStorage === 'undefined') {
    return cloneStarterEvents()
  }

  try {
    const storedValue = localStorage.getItem(EVENTS_STORAGE_KEY)

    if (storedValue === null) {
      return cloneStarterEvents()
    }

    const parsedValue: unknown = JSON.parse(storedValue)
    return Array.isArray(parsedValue) && parsedValue.every(isEvent)
      ? parsedValue
      : cloneStarterEvents()
  } catch {
    return cloneStarterEvents()
  }
}

export async function getEvents(): Promise<EventTimesEvent[]> {
  if (!db) {
    return getLocalEvents()
  }

  const snapshot = await getDocs(collection(db, EVENTS_COLLECTION))
  return snapshot.docs.map((eventDocument) =>
    normalizeEvent(eventDocument.data(), eventDocument.id),
  )
}

export async function createEvent(event: EventTimesEvent): Promise<EventTimesEvent[]> {
  if (!db) {
    const events = getLocalEvents()

    if (events.some((existingEvent) => existingEvent.id === event.id)) {
      throw new Error('Wydarzenie z tym identyfikatorem już istnieje.')
    }

    const updatedEvents = [...events, event]
    persistEventsLocally(updatedEvents)
    return updatedEvents
  }

  const eventRef = doc(db, EVENTS_COLLECTION, event.id)
  const existingEvent = await getDoc(eventRef)

  if (existingEvent.exists()) {
    throw new Error('Wydarzenie z tym identyfikatorem już istnieje.')
  }

  await setDoc(eventRef, toFirestoreData(withWriteTimestamps(event, true)))
  return getEvents()
}

export async function saveEvent(event: EventTimesEvent): Promise<EventTimesEvent[]> {
  return createEvent(event)
}

export async function updateEvent(updatedEvent: EventTimesEvent): Promise<EventTimesEvent[]> {
  if (!db) {
    const events = getLocalEvents()

    if (!events.some((event) => event.id === updatedEvent.id)) {
      throw new Error('Nie znaleziono wydarzenia do aktualizacji.')
    }

    const updatedEvents = events.map((event) =>
      event.id === updatedEvent.id ? updatedEvent : event,
    )
    persistEventsLocally(updatedEvents)
    return updatedEvents
  }

  await updateDoc(
    doc(db, EVENTS_COLLECTION, updatedEvent.id),
    toFirestoreData(withWriteTimestamps(updatedEvent, false)),
  )
  return getEvents()
}

export async function deleteEvent(eventId: string): Promise<EventTimesEvent[]> {
  if (!db) {
    const updatedEvents = getLocalEvents().filter((event) => event.id !== eventId)
    persistEventsLocally(updatedEvents)
    return updatedEvents
  }

  await deleteDoc(doc(db, EVENTS_COLLECTION, eventId))
  return getEvents()
}

export async function deleteEventsByVenueId(venueId: string): Promise<EventTimesEvent[]> {
  if (!db) {
    const updatedEvents = getLocalEvents().filter((event) => event.venueId !== venueId)
    persistEventsLocally(updatedEvents)
    return updatedEvents
  }

  const snapshot = await getDocs(
    query(collection(db, EVENTS_COLLECTION), where('venueId', '==', venueId)),
  )
  const batch = writeBatch(db)
  snapshot.docs.forEach((eventDocument) => {
    batch.delete(eventDocument.ref)
  })
  await batch.commit()

  return getEvents()
}

export function replaceEvents(events: EventTimesEvent[]): EventTimesEvent[] {
  const nextEvents = events.map((event) => ({ ...event }))
  persistEventsLocally(nextEvents)
  return nextEvents
}

export async function replaceEventsInFirestore(events: EventTimesEvent[]) {
  if (!db) {
    throw new Error('Firebase Firestore nie jest skonfigurowany.')
  }

  const database = db
  const batch = writeBatch(database)

  events.forEach((event) => {
    batch.set(
      doc(database, EVENTS_COLLECTION, event.id),
      toFirestoreData(withWriteTimestamps(event, !event.createdAt)),
      { merge: true },
    )
  })

  await batch.commit()
}

export function clearStoredEvents(): EventTimesEvent[] {
  localStorage.removeItem(EVENTS_STORAGE_KEY)
  return cloneStarterEvents()
}
