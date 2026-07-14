import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { mockVenues } from '../data/mockVenues'
import type { Venue } from '../data/mockVenues'
import { isMediaImage } from '../features/media/mediaModel'
import { db } from '../lib/firebase'
import { isValidGoogleMapsUrl } from '../utils/googleMaps'

const VENUES_STORAGE_KEY = 'event-times.venues.v1'
const VENUES_COLLECTION = 'venues'

function cloneStarterVenues(): Venue[] {
  return mockVenues.map((venue) => ({
    ...venue,
    coordinates: { ...venue.coordinates },
  }))
}

function isVenue(value: unknown): value is Venue {
  if (!value || typeof value !== 'object') {
    return false
  }

  const venue = value as Partial<Venue>
  const coordinates = venue.coordinates
  const images = venue.images

  return (
    typeof venue.id === 'string' &&
    typeof venue.name === 'string' &&
    typeof venue.city === 'string' &&
    typeof venue.address === 'string' &&
    (typeof venue.venueType === 'string' ||
      typeof venue.category === 'string' ||
      typeof venue.type === 'string') &&
    typeof venue.description === 'string' &&
    (venue.googleMapsUrl === undefined ||
      (typeof venue.googleMapsUrl === 'string' &&
        (!venue.googleMapsUrl.trim() || isValidGoogleMapsUrl(venue.googleMapsUrl)))) &&
    (venue.slug === undefined || typeof venue.slug === 'string') &&
    (venue.country === undefined || typeof venue.country === 'string') &&
    (venue.type === undefined || typeof venue.type === 'string') &&
    (venue.category === undefined || typeof venue.category === 'string') &&
    (venue.capacity === undefined || typeof venue.capacity === 'number') &&
    (venue.imageUrl === undefined || typeof venue.imageUrl === 'string') &&
    (venue.websiteUrl === undefined || typeof venue.websiteUrl === 'string') &&
    (venue.status === undefined ||
      venue.status === 'active' ||
      venue.status === 'draft' ||
      venue.status === 'archived') &&
    (images === undefined || (Array.isArray(images) && images.every(isMediaImage))) &&
    typeof coordinates?.lat === 'number' &&
    Number.isFinite(coordinates.lat) &&
    typeof coordinates.lng === 'number' &&
    Number.isFinite(coordinates.lng)
  )
}

function normalizeVenue(value: unknown, fallbackId: string): Venue {
  const venue = value && typeof value === 'object' ? (value as Partial<Venue>) : {}
  const coordinates = venue.coordinates

  return {
    id: typeof venue.id === 'string' && venue.id.trim() ? venue.id.trim() : fallbackId,
    name: typeof venue.name === 'string' ? venue.name : '',
    slug: typeof venue.slug === 'string' ? venue.slug : undefined,
    city: typeof venue.city === 'string' ? venue.city : 'Leszno',
    country: typeof venue.country === 'string' ? venue.country : undefined,
    address: typeof venue.address === 'string' ? venue.address : '',
    venueType:
      typeof venue.venueType === 'string'
        ? venue.venueType
        : typeof venue.category === 'string'
          ? venue.category
          : typeof venue.type === 'string'
            ? venue.type
            : 'Inne',
    type: typeof venue.type === 'string' ? venue.type : undefined,
    category: typeof venue.category === 'string' ? venue.category : undefined,
    description: typeof venue.description === 'string' ? venue.description : '',
    coordinates: {
      lat: typeof coordinates?.lat === 'number' ? coordinates.lat : 0,
      lng: typeof coordinates?.lng === 'number' ? coordinates.lng : 0,
    },
    capacity: typeof venue.capacity === 'number' ? venue.capacity : undefined,
    googleMapsUrl:
      typeof venue.googleMapsUrl === 'string' ? venue.googleMapsUrl : undefined,
    websiteUrl: typeof venue.websiteUrl === 'string' ? venue.websiteUrl : undefined,
    imageUrl: typeof venue.imageUrl === 'string' ? venue.imageUrl : undefined,
    images:
      Array.isArray(venue.images) && venue.images.every(isMediaImage)
        ? venue.images
        : undefined,
    status:
      venue.status === 'active' || venue.status === 'draft' || venue.status === 'archived'
        ? venue.status
        : undefined,
    createdAt: typeof venue.createdAt === 'string' ? venue.createdAt : undefined,
    updatedAt: typeof venue.updatedAt === 'string' ? venue.updatedAt : undefined,
  }
}

function withWriteTimestamps(venue: Venue, isCreate: boolean): Venue {
  const now = new Date().toISOString()

  return {
    ...venue,
    createdAt: isCreate ? venue.createdAt ?? now : venue.createdAt,
    updatedAt: now,
  }
}

function toFirestoreData(venue: Venue) {
  return JSON.parse(JSON.stringify(venue)) as Venue
}

function persistVenuesLocally(venues: Venue[]) {
  localStorage.setItem(VENUES_STORAGE_KEY, JSON.stringify(venues))
}

export function getLocalVenues(): Venue[] {
  if (typeof localStorage === 'undefined') {
    return cloneStarterVenues()
  }

  try {
    const storedValue = localStorage.getItem(VENUES_STORAGE_KEY)

    if (storedValue === null) {
      return cloneStarterVenues()
    }

    const parsedValue: unknown = JSON.parse(storedValue)
    return Array.isArray(parsedValue) && parsedValue.every(isVenue)
      ? parsedValue
      : cloneStarterVenues()
  } catch {
    return cloneStarterVenues()
  }
}

export async function getVenues(): Promise<Venue[]> {
  if (!db) {
    return getLocalVenues()
  }

  const snapshot = await getDocs(collection(db, VENUES_COLLECTION))
  return snapshot.docs.map((venueDocument) =>
    normalizeVenue(venueDocument.data(), venueDocument.id),
  )
}

export async function createVenue(venue: Venue): Promise<Venue[]> {
  if (!db) {
    const venues = getLocalVenues()

    if (venues.some((existingVenue) => existingVenue.id === venue.id)) {
      throw new Error('Miejsce z tym identyfikatorem już istnieje.')
    }

    const updatedVenues = [...venues, venue]
    persistVenuesLocally(updatedVenues)
    return updatedVenues
  }

  const venueRef = doc(db, VENUES_COLLECTION, venue.id)
  const existingVenue = await getDoc(venueRef)

  if (existingVenue.exists()) {
    throw new Error('Miejsce z tym identyfikatorem już istnieje.')
  }

  await setDoc(venueRef, toFirestoreData(withWriteTimestamps(venue, true)))
  return getVenues()
}

export async function saveVenue(venue: Venue): Promise<Venue[]> {
  return createVenue(venue)
}

export async function updateVenue(updatedVenue: Venue): Promise<Venue[]> {
  if (!db) {
    const venues = getLocalVenues()

    if (!venues.some((venue) => venue.id === updatedVenue.id)) {
      throw new Error('Nie znaleziono miejsca do aktualizacji.')
    }

    const updatedVenues = venues.map((venue) =>
      venue.id === updatedVenue.id ? updatedVenue : venue,
    )
    persistVenuesLocally(updatedVenues)
    return updatedVenues
  }

  await updateDoc(
    doc(db, VENUES_COLLECTION, updatedVenue.id),
    toFirestoreData(withWriteTimestamps(updatedVenue, false)),
  )
  return getVenues()
}

export async function deleteVenue(venueId: string): Promise<Venue[]> {
  if (!db) {
    const updatedVenues = getLocalVenues().filter((venue) => venue.id !== venueId)
    persistVenuesLocally(updatedVenues)
    return updatedVenues
  }

  await deleteDoc(doc(db, VENUES_COLLECTION, venueId))
  return getVenues()
}

export function replaceVenues(venues: Venue[]): Venue[] {
  const nextVenues = venues.map((venue) => ({
    ...venue,
    coordinates: { ...venue.coordinates },
  }))
  persistVenuesLocally(nextVenues)
  return nextVenues
}

export async function replaceVenuesInFirestore(venues: Venue[]) {
  if (!db) {
    throw new Error('Firebase Firestore nie jest skonfigurowany.')
  }

  const database = db
  const batch = writeBatch(database)

  venues.forEach((venue) => {
    batch.set(
      doc(database, VENUES_COLLECTION, venue.id),
      toFirestoreData(withWriteTimestamps(venue, !venue.createdAt)),
      { merge: true },
    )
  })

  await batch.commit()
}

export function clearStoredVenues(): Venue[] {
  localStorage.removeItem(VENUES_STORAGE_KEY)
  return cloneStarterVenues()
}
