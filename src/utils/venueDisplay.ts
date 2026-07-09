import type { Venue } from '../data/mockVenues'

const NON_STREET_PREFIXES = [
  'al.',
  'aleja',
  'plac',
  'pl.',
  'rynek',
  'rondo',
  'os.',
]

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeSpaces(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function stripCitySuffix(address: string, city: string) {
  if (!city.trim()) {
    return address
  }

  let normalizedAddress = address.trim()
  const citySuffixPattern = new RegExp(`\\s*,\\s*${escapeRegExp(city.trim())}\\s*$`, 'i')

  while (citySuffixPattern.test(normalizedAddress)) {
    normalizedAddress = normalizedAddress.replace(citySuffixPattern, '').trim()
  }

  return normalizedAddress
}

function normalizeStreetPrefix(address: string) {
  return address.replace(/^ulica\s+/i, 'ul. ').trim()
}

export function normalizeVenueAddressInput(address: string, city: string) {
  const withoutCity = stripCitySuffix(normalizeSpaces(address), city)

  return withoutCity
    .replace(/^ul\.\s*/i, '')
    .replace(/^ulica\s+/i, '')
    .trim()
}

export function formatVenueAddress(venue: Pick<Venue, 'address' | 'city'>) {
  const city = normalizeSpaces(venue.city)
  const baseAddress = normalizeStreetPrefix(stripCitySuffix(normalizeSpaces(venue.address), city))

  if (!baseAddress && !city) {
    return 'Miejsce bez nazwy'
  }

  if (!baseAddress) {
    return city
  }

  const normalizedBase = baseAddress.toLocaleLowerCase('pl-PL')
  const hasAddressPrefix =
    normalizedBase.startsWith('ul.') ||
    NON_STREET_PREFIXES.some((prefix) => normalizedBase.startsWith(prefix))
  const displayAddress = hasAddressPrefix ? baseAddress : `ul. ${baseAddress}`

  return city ? `${displayAddress}, ${city}` : displayAddress
}

export function getVenueDisplayName(venue: Venue) {
  return venue.name.trim() || formatVenueAddress(venue) || 'Miejsce bez nazwy'
}
