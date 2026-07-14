import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { isMediaImage } from '../features/media/mediaModel'
import { parseEventDate } from '../utils/eventStatus'
import { isValidGoogleMapsUrl } from '../utils/googleMaps'

export type LocalBackupData = {
  appName: 'Event Times'
  dataVersion: 1
  exportedAt: string
  venues: Venue[]
  events: EventTimesEvent[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function optionalGoogleMapsUrl(value: unknown, venueName: string) {
  const url = optionalString(value)

  if (url && !isValidGoogleMapsUrl(url)) {
    throw new Error(`Miejsce „${venueName}” ma niepoprawny link Google Maps.`)
  }

  return url
}

function optionalImages(value: unknown) {
  return Array.isArray(value) && value.every(isMediaImage) ? value : undefined
}

function parseVenue(value: unknown, index: number): Venue {
  if (!isRecord(value)) {
    throw new Error(`Miejsce nr ${index + 1} nie jest poprawnym obiektem.`)
  }

  const coordinates = value.coordinates

  if (
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    !isRecord(coordinates) ||
    typeof coordinates.lat !== 'number' ||
    !Number.isFinite(coordinates.lat) ||
    typeof coordinates.lng !== 'number' ||
    !Number.isFinite(coordinates.lng)
  ) {
    throw new Error(
      `Miejsce nr ${index + 1} musi mieć id, name oraz coordinates.lat/lng.`,
    )
  }

  if (coordinates.lat < -90 || coordinates.lat > 90) {
    throw new Error(`Miejsce „${value.name}” ma niepoprawną wartość latitude.`)
  }

  if (coordinates.lng < -180 || coordinates.lng > 180) {
    throw new Error(`Miejsce „${value.name}” ma niepoprawną wartość longitude.`)
  }

  return {
    id: value.id.trim(),
    name: typeof value.name === 'string' ? value.name.trim() : '',
    slug: optionalString(value.slug),
    city: optionalString(value.city) ?? 'Leszno',
    country: optionalString(value.country),
    address: optionalString(value.address) ?? '',
    venueType:
      optionalString(value.venueType) ??
      optionalString(value.category) ??
      optionalString(value.type) ??
      'Inne',
    type: optionalString(value.type),
    category: optionalString(value.category),
    description: optionalString(value.description) ?? '',
    googleMapsUrl: optionalGoogleMapsUrl(value.googleMapsUrl, optionalString(value.name) ?? `nr ${index + 1}`),
    websiteUrl: optionalString(value.websiteUrl),
    imageUrl: optionalString(value.imageUrl),
    images: optionalImages(value.images),
    capacity: typeof value.capacity === 'number' ? value.capacity : undefined,
    status:
      value.status === 'active' || value.status === 'draft' || value.status === 'archived'
        ? value.status
        : undefined,
    coordinates: {
      lat: coordinates.lat,
      lng: coordinates.lng,
    },
  }
}

function parseEvent(value: unknown, index: number): EventTimesEvent {
  if (!isRecord(value)) {
    throw new Error(`Wydarzenie nr ${index + 1} nie jest poprawnym obiektem.`)
  }

  if (
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.venueId !== 'string' ||
    !value.venueId.trim() ||
    !optionalString(value.name) && !optionalString(value.title) ||
    typeof value.startDate !== 'string' ||
    !value.startDate.trim()
  ) {
    throw new Error(
      `Wydarzenie nr ${index + 1} musi mieć id, venueId, name i startDate.`,
    )
  }

  if (!parseEventDate(value.startDate)) {
    throw new Error(`Wydarzenie „${value.name}” ma niepoprawną datę startu.`)
  }

  const endDate = optionalString(value.endDate)

  if (endDate && !parseEventDate(endDate)) {
    throw new Error(`Wydarzenie „${value.name}” ma niepoprawną datę końca.`)
  }

  return {
    id: value.id.trim(),
    venueId: value.venueId.trim(),
    name: optionalString(value.name) ?? optionalString(value.title) ?? '',
    title: optionalString(value.title),
    slug: optionalString(value.slug),
    eventType: optionalString(value.eventType) ?? optionalString(value.category) ?? 'Inne',
    category: optionalString(value.category),
    description: optionalString(value.description) ?? '',
    startDate: value.startDate,
    endDate,
    startTime: optionalString(value.startTime),
    endTime: optionalString(value.endTime),
    ticketUrl: optionalString(value.ticketUrl),
    sourceUrl: optionalString(value.sourceUrl),
    imageUrl: optionalString(value.imageUrl),
    images: optionalImages(value.images),
    organizer: optionalString(value.organizer),
    isPromoted: typeof value.isPromoted === 'boolean' ? value.isPromoted : undefined,
    status:
      value.status === 'published' || value.status === 'draft' || value.status === 'cancelled'
        ? value.status
        : undefined,
    externalIds:
      isRecord(value.externalIds) && typeof value.externalIds.ticketmaster === 'string'
        ? { ticketmaster: value.externalIds.ticketmaster }
        : undefined,
  }
}

function ensureUniqueIds(items: Array<{ id: string }>, label: string) {
  const ids = new Set(items.map((item) => item.id))

  if (ids.size !== items.length) {
    throw new Error(`${label} zawierają powtarzające się identyfikatory.`)
  }
}

export function createLocalBackup(
  venues: Venue[],
  events: EventTimesEvent[],
): LocalBackupData {
  return {
    appName: 'Event Times',
    dataVersion: 1,
    exportedAt: new Date().toISOString(),
    venues,
    events,
  }
}

export function downloadLocalBackup(venues: Venue[], events: EventTimesEvent[]) {
  const backup = createLocalBackup(venues, events)
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const objectUrl = URL.createObjectURL(blob)
  const downloadLink = document.createElement('a')
  downloadLink.href = objectUrl
  downloadLink.download = 'event-times-local-backup.json'
  document.body.append(downloadLink)
  downloadLink.click()
  downloadLink.remove()
  URL.revokeObjectURL(objectUrl)
}

export async function readLocalBackup(file: File): Promise<LocalBackupData> {
  let parsedValue: unknown

  try {
    parsedValue = JSON.parse(await file.text())
  } catch {
    throw new Error('Nie udało się odczytać pliku JSON.')
  }

  if (!isRecord(parsedValue)) {
    throw new Error('Plik backupu musi zawierać obiekt JSON.')
  }

  if (!Array.isArray(parsedValue.venues) || !Array.isArray(parsedValue.events)) {
    throw new Error('Plik musi zawierać tablice venues i events.')
  }

  const venues = parsedValue.venues.map(parseVenue)
  const events = parsedValue.events.map(parseEvent)
  ensureUniqueIds(venues, 'Miejsca')
  ensureUniqueIds(events, 'Wydarzenia')

  const venueIds = new Set(venues.map((venue) => venue.id))
  const eventWithoutVenue = events.find((event) => !venueIds.has(event.venueId))

  if (eventWithoutVenue) {
    throw new Error(
      `Wydarzenie „${eventWithoutVenue.name}” wskazuje nieistniejące miejsce.`,
    )
  }

  return {
    appName: 'Event Times',
    dataVersion: 1,
    exportedAt: optionalString(parsedValue.exportedAt) ?? new Date().toISOString(),
    venues,
    events,
  }
}
