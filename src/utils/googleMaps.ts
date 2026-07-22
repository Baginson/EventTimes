import type { Venue } from '../data/mockVenues'
import { isValidCoordinates } from './geo'

type Coordinates = Venue['coordinates']

export type ParsedGoogleMapsUrl = {
  rawUrl: string
  lat?: number
  lng?: number
  name?: string
}

export function isValidGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function createCoordinates(latValue: string, lngValue: string): Coordinates | null {
  const lat = Number(latValue)
  const lng = Number(lngValue)

  return isValidCoordinates(lat, lng) ? { lat, lng } : null
}

function parseCoordinatePair(value: string): Coordinates | null {
  const match = value
    .trim()
    .match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)

  return match ? createCoordinates(match[1], match[2]) : null
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function isShortGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    return host === 'maps.app.goo.gl' || host === 'goo.gl'
  } catch {
    return false
  }
}

function firstValidCoordinates(matches: Array<RegExpMatchArray | null>) {
  for (const match of matches) {
    if (!match) {
      continue
    }

    const coordinates = createCoordinates(match[1], match[2])

    if (coordinates) {
      return coordinates
    }
  }

  return null
}

function parsePlaceName(url: URL) {
  const segments = url.pathname.split('/').filter(Boolean)
  const placeIndex = segments.findIndex((segment) => segment === 'place')

  if (placeIndex === -1 || !segments[placeIndex + 1]) {
    return undefined
  }

  const rawName = segments[placeIndex + 1]
    .split('?')[0]
    .split('@')[0]
    .replace(/\+/g, ' ')

  try {
    return safeDecodeURIComponent(rawName).trim() || undefined
  } catch {
    return rawName.trim() || undefined
  }
}

export function parseGoogleMapsUrl(value: string): ParsedGoogleMapsUrl {
  const rawUrl = value.trim()

  if (!isValidGoogleMapsUrl(rawUrl)) {
    return { rawUrl }
  }

  const url = new URL(rawUrl)
  const decodedUrl = safeDecodeURIComponent(rawUrl)
  const dataCoordinates = firstValidCoordinates([
    rawUrl.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/),
    decodedUrl.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/),
  ])
  const viewportCoordinates = firstValidCoordinates([
    rawUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),/),
    decodedUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),/),
  ])
  const queryCoordinates =
    parseCoordinatePair(url.searchParams.get('query') ?? '') ??
    parseCoordinatePair(url.searchParams.get('destination') ?? '') ??
    parseCoordinatePair(url.searchParams.get('q') ?? '')
  const coordinates = dataCoordinates ?? viewportCoordinates ?? queryCoordinates

  return {
    rawUrl,
    ...(coordinates ? coordinates : {}),
    name: parsePlaceName(url),
  }
}

export function parseGoogleMapsCoordinates(value: string): Coordinates | null {
  const parsedUrl = parseGoogleMapsUrl(value)

  if (typeof parsedUrl.lat === 'number' && typeof parsedUrl.lng === 'number') {
    return { lat: parsedUrl.lat, lng: parsedUrl.lng }
  }

  return null
}

export function hasValidVenueCoordinates(venue: Venue) {
  return isValidCoordinates(venue.coordinates.lat, venue.coordinates.lng)
}

export function buildVenueDirectionsUrl(venue: Venue) {
  const destination = `${venue.coordinates.lat},${venue.coordinates.lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

export function getVenueGoogleMapsUrl(venue: Venue) {
  const customUrl = venue.googleMapsUrl?.trim()

  if (customUrl && isValidGoogleMapsUrl(customUrl)) {
    return customUrl
  }

  return buildVenueDirectionsUrl(venue)
}
