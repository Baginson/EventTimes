import type { Venue } from '../data/mockVenues'

export function isValidGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function getVenueGoogleMapsUrl(venue: Venue) {
  const customUrl = venue.googleMapsUrl?.trim()

  if (customUrl && isValidGoogleMapsUrl(customUrl)) {
    return customUrl
  }

  const destination = `${venue.coordinates.lat},${venue.coordinates.lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}
