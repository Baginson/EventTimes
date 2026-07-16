import { describe, expect, it } from 'vitest'
import type { Venue } from '../data/mockVenues'
import { formatVenueAddress, getVenueDisplayName } from './venueDisplay'

function buildVenue(overrides: Partial<Venue> = {}): Venue {
  return {
    id: 'test-venue',
    name: 'Testowe miejsce',
    city: 'Leszno',
    address: 'Krótka 4',
    venueType: 'Sala',
    coordinates: { lat: 51.8419, lng: 16.5745 },
    description: 'Opis testowego miejsca.',
    ...overrides,
  }
}

describe('formatVenueAddress', () => {
  it('adds an artificial "ul." prefix to plain street addresses', () => {
    expect(formatVenueAddress({ address: 'Krótka 4', city: 'Leszno' })).toBe('ul. Krótka 4, Leszno')
  })

  it('does not duplicate an existing "ul." prefix', () => {
    expect(
      formatVenueAddress({ address: 'ul. Bolesława Chrobrego 3A', city: 'Leszno' }),
    ).toBe('ul. Bolesława Chrobrego 3A, Leszno')
  })

  it('normalizes a spelled-out "ulica" prefix to "ul."', () => {
    expect(formatVenueAddress({ address: 'ulica Krótka 4', city: 'Leszno' })).toBe(
      'ul. Krótka 4, Leszno',
    )
  })

  it.each(['Rynek', 'Plac Wolności 1', 'al. Wojska Polskiego 5', 'rondo Kaponiera', 'os. Słoneczne 2'])(
    'does not add an artificial "ul." prefix when the address starts with %s',
    (address) => {
      const result = formatVenueAddress({ address, city: 'Leszno' })

      expect(result.startsWith('ul.')).toBe(false)
      expect(result).toBe(`${address}, Leszno`)
    },
  )

  it('strips a duplicated city suffix already present in the address', () => {
    expect(
      formatVenueAddress({ address: 'ul. Bolesława Chrobrego 3A, Leszno', city: 'Leszno' }),
    ).toBe('ul. Bolesława Chrobrego 3A, Leszno')
  })

  it('strips a duplicated city suffix regardless of case', () => {
    expect(
      formatVenueAddress({ address: 'ul. Krótka 4, LESZNO', city: 'Leszno' }),
    ).toBe('ul. Krótka 4, Leszno')
  })

  it('returns just the city when the address is empty', () => {
    expect(formatVenueAddress({ address: '  ', city: 'Leszno' })).toBe('Leszno')
  })

  it('returns a Polish placeholder when both address and city are empty', () => {
    expect(formatVenueAddress({ address: '  ', city: '  ' })).toBe('Miejsce bez nazwy')
  })
})

describe('getVenueDisplayName', () => {
  it('returns the trimmed venue name when present', () => {
    expect(getVenueDisplayName(buildVenue({ name: '  Hala Trapez  ' }))).toBe('Hala Trapez')
  })

  it('falls back to the formatted address when the name is empty', () => {
    const venue = buildVenue({ name: '  ', address: 'Krótka 4', city: 'Leszno' })

    expect(getVenueDisplayName(venue)).toBe('ul. Krótka 4, Leszno')
  })

  it('falls back to the Polish placeholder when name and address are both empty', () => {
    const venue = buildVenue({ name: '  ', address: '  ', city: '  ' })

    expect(getVenueDisplayName(venue)).toBe('Miejsce bez nazwy')
  })
})
