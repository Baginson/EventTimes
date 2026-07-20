import type { Venue } from '../data/mockVenues'
import {
  buildVenueDirectionsUrl,
  getVenueGoogleMapsUrl,
  hasValidVenueCoordinates,
} from './googleMaps'
import { getVenueDisplayName } from './venueDisplay'

export type NavigationPlatform = 'android' | 'ios' | 'desktop'

export function detectNavigationPlatform(
  userAgent: string,
  maxTouchPoints: number,
): NavigationPlatform {
  if (/android/i.test(userAgent)) {
    return 'android'
  }

  // iPadOS podaje się za macOS — odróżnia go dotyk.
  if (
    /iphone|ipad|ipod/i.test(userAgent) ||
    (/macintosh/i.test(userAgent) && maxTouchPoints > 1)
  ) {
    return 'ios'
  }

  return 'desktop'
}

export function getCurrentNavigationPlatform(): NavigationPlatform {
  return detectNavigationPlatform(
    navigator.userAgent,
    navigator.maxTouchPoints ?? 0,
  )
}

// geo: otwiera systemowy wybór aplikacji nawigacyjnej na Androidzie.
export function buildGeoUri(venue: Venue): string {
  const { lat, lng } = venue.coordinates
  const label = encodeURIComponent(getVenueDisplayName(venue))
  return `geo:${lat},${lng}?q=${lat},${lng}(${label})`
}

export function buildAppleMapsUrl(venue: Venue): string {
  const { lat, lng } = venue.coordinates
  return `https://maps.apple.com/?daddr=${lat},${lng}`
}

export function buildGoogleMapsNavigationUrl(venue: Venue): string {
  return hasValidVenueCoordinates(venue)
    ? buildVenueDirectionsUrl(venue)
    : getVenueGoogleMapsUrl(venue)
}
