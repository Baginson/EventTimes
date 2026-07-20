import { describe, expect, it } from 'vitest'
import type { Venue } from '../data/mockVenues'
import {
  buildAppleMapsUrl,
  buildGeoUri,
  buildGoogleMapsNavigationUrl,
  detectNavigationPlatform,
} from './navigationLinks'

const venue: Venue = {
  id: 'test-venue',
  name: 'Hala Trapez',
  address: 'ul. Zygmunta Starego 1',
  city: 'Leszno',
  venueType: 'Hala',
  description: '',
  coordinates: { lat: 51.8418, lng: 16.5761 },
}

describe('detectNavigationPlatform', () => {
  it('rozpoznaje Androida', () => {
    expect(
      detectNavigationPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8)', 5),
    ).toBe('android')
  })

  it('rozpoznaje iPhone i iPada', () => {
    expect(
      detectNavigationPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5),
    ).toBe('ios')
    expect(
      detectNavigationPlatform('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', 5),
    ).toBe('ios')
  })

  it('rozpoznaje iPadOS podający się za macOS po dotyku', () => {
    expect(
      detectNavigationPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5),
    ).toBe('ios')
  })

  it('desktop bez dotyku zostaje desktopem', () => {
    expect(
      detectNavigationPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0),
    ).toBe('desktop')
    expect(
      detectNavigationPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 0),
    ).toBe('desktop')
  })
})

describe('buildGeoUri', () => {
  it('buduje geo: URI ze współrzędnymi i nazwą miejsca', () => {
    expect(buildGeoUri(venue)).toBe(
      'geo:51.8418,16.5761?q=51.8418,16.5761(Hala%20Trapez)',
    )
  })
})

describe('buildAppleMapsUrl', () => {
  it('buduje link Apple Maps z celem podróży', () => {
    expect(buildAppleMapsUrl(venue)).toBe(
      'https://maps.apple.com/?daddr=51.8418,16.5761',
    )
  })
})

describe('buildGoogleMapsNavigationUrl', () => {
  it('dla poprawnych współrzędnych buduje link nawigacji Google Maps', () => {
    expect(buildGoogleMapsNavigationUrl(venue)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=51.8418%2C16.5761',
    )
  })

  it('bez poprawnych współrzędnych używa zapasowego linku miejsca', () => {
    const invalidVenue: Venue = {
      ...venue,
      coordinates: { lat: Number.NaN, lng: Number.NaN },
      googleMapsUrl: 'https://maps.app.goo.gl/abc123',
    }

    expect(buildGoogleMapsNavigationUrl(invalidVenue)).toBe(
      'https://maps.app.goo.gl/abc123',
    )
  })
})
