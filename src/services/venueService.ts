import { mockVenues } from '../data/mockVenues'
import type { Venue } from '../data/mockVenues'

const VENUES_STORAGE_KEY = 'event-times.venues.v1'

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

  return (
    typeof venue.id === 'string' &&
    typeof venue.name === 'string' &&
    typeof venue.city === 'string' &&
    typeof venue.address === 'string' &&
    typeof venue.venueType === 'string' &&
    typeof venue.description === 'string' &&
    typeof coordinates?.lat === 'number' &&
    Number.isFinite(coordinates.lat) &&
    typeof coordinates.lng === 'number' &&
    Number.isFinite(coordinates.lng)
  )
}

function persistVenues(venues: Venue[]) {
  localStorage.setItem(VENUES_STORAGE_KEY, JSON.stringify(venues))
}

export function getVenues(): Venue[] {
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

export function saveVenue(venue: Venue): Venue[] {
  const venues = getVenues()

  if (venues.some((existingVenue) => existingVenue.id === venue.id)) {
    throw new Error('Miejsce z tym identyfikatorem już istnieje.')
  }

  const updatedVenues = [...venues, venue]
  persistVenues(updatedVenues)
  return updatedVenues
}

export function updateVenue(updatedVenue: Venue): Venue[] {
  const venues = getVenues()

  if (!venues.some((venue) => venue.id === updatedVenue.id)) {
    throw new Error('Nie znaleziono miejsca do aktualizacji.')
  }

  const updatedVenues = venues.map((venue) =>
    venue.id === updatedVenue.id ? updatedVenue : venue,
  )
  persistVenues(updatedVenues)
  return updatedVenues
}

export function deleteVenue(venueId: string): Venue[] {
  const updatedVenues = getVenues().filter((venue) => venue.id !== venueId)
  persistVenues(updatedVenues)
  return updatedVenues
}

export function replaceVenues(venues: Venue[]): Venue[] {
  const nextVenues = venues.map((venue) => ({
    ...venue,
    coordinates: { ...venue.coordinates },
  }))
  persistVenues(nextVenues)
  return nextVenues
}

export function clearStoredVenues(): Venue[] {
  localStorage.removeItem(VENUES_STORAGE_KEY)
  return cloneStarterVenues()
}
