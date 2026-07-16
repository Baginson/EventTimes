import { describe, expect, it } from 'vitest'
import { getDistanceMeters } from './geo'

describe('getDistanceMeters', () => {
  it('returns 0 for identical coordinates', () => {
    const point = { lat: 51.8419, lng: 16.5745 }

    expect(getDistanceMeters(point, point)).toBe(0)
  })

  it('approximates 111.32km per degree of latitude at the equator', () => {
    const first = { lat: 0, lng: 0 }
    const second = { lat: 1, lng: 0 }

    expect(getDistanceMeters(first, second)).toBeCloseTo(111_320, 0)
  })

  it('is symmetric regardless of argument order', () => {
    const first = { lat: 51.8419, lng: 16.5745 }
    const second = { lat: 51.847, lng: 16.5757 }

    expect(getDistanceMeters(first, second)).toBeCloseTo(getDistanceMeters(second, first), 6)
  })

  it('computes a plausible distance between two nearby venues', () => {
    const mokLeszno = { lat: 51.8419, lng: 16.5745 }
    const halaTrapez = { lat: 51.847, lng: 16.5757 }

    const distance = getDistanceMeters(mokLeszno, halaTrapez)

    expect(distance).toBeGreaterThan(500)
    expect(distance).toBeLessThan(700)
  })
})
