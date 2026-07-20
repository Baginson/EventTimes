import { describe, expect, it } from 'vitest'
import {
  formatTravelDistance,
  formatTravelDuration,
  formatTravelSummary,
} from './travelFormat'

describe('formatTravelDuration', () => {
  it('zaokrągla sekundy do minut', () => {
    expect(formatTravelDuration(782)).toBe('13 min')
    expect(formatTravelDuration(480)).toBe('8 min')
  })

  it('nigdy nie schodzi poniżej 1 min', () => {
    expect(formatTravelDuration(10)).toBe('1 min')
  })

  it('formatuje godziny z minutami', () => {
    expect(formatTravelDuration(3600)).toBe('1 godz.')
    expect(formatTravelDuration(4500)).toBe('1 godz. 15 min')
  })
})

describe('formatTravelDistance', () => {
  it('poniżej kilometra pokazuje metry zaokrąglone do 10 m', () => {
    expect(formatTravelDistance(873)).toBe('870 m')
    expect(formatTravelDistance(4)).toBe('10 m')
  })

  it('poniżej 10 km pokazuje jedno miejsce po przecinku z polskim przecinkiem', () => {
    expect(formatTravelDistance(2100)).toBe('2,1 km')
    expect(formatTravelDistance(1873)).toBe('1,9 km')
  })

  it('od 10 km pokazuje pełne kilometry', () => {
    expect(formatTravelDistance(12600)).toBe('13 km')
  })
})

describe('formatTravelSummary', () => {
  it('składa wynik w formacie "Około X min • Y km"', () => {
    expect(
      formatTravelSummary({ durationSeconds: 480, distanceMeters: 2100 }),
    ).toBe('Około 8 min • 2,1 km')
  })
})
