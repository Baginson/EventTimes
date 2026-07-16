import { describe, expect, it } from 'vitest'
import { normalizeForMatch } from './textNormalize'

describe('normalizeForMatch', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeForMatch('Łódź')).toBe('odz')
  })

  it('replaces punctuation and extra whitespace with single spaces', () => {
    expect(normalizeForMatch('Hala Trapez, Leszno!')).toBe('hala trapez leszno')
  })

  it('trims leading and trailing whitespace introduced by normalization', () => {
    expect(normalizeForMatch('  test-value  ')).toBe('test value')
  })

  it('returns an empty string for undefined input', () => {
    expect(normalizeForMatch(undefined)).toBe('')
  })

  it('returns an empty string for an already-empty input', () => {
    expect(normalizeForMatch('')).toBe('')
  })
})
