import { describe, expect, it } from 'vitest'
import {
  limitSearchResults,
  matchesTokenPrefix,
  normalizeSearchText,
  uniqueById,
} from './searchModel'

describe('normalizeSearchText', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeSearchText('Łódź')).toBe('lodz')
  })

  it('trims surrounding whitespace and collapses locale-specific casing', () => {
    expect(normalizeSearchText('  Wieczór Komedii  ')).toBe('wieczor komedii')
  })

  it('handles an already-normalized string unchanged', () => {
    expect(normalizeSearchText('hala trapez')).toBe('hala trapez')
  })
})

describe('matchesTokenPrefix', () => {
  it('matches when every query token prefixes some name token', () => {
    expect(matchesTokenPrefix('Wieczór Komedii', 'kom wiecz')).toBe(true)
  })

  it('matches case-insensitively and ignoring diacritics', () => {
    expect(matchesTokenPrefix('Łódź Filharmonia', 'lodz')).toBe(true)
  })

  it('returns false when a query token has no matching name token', () => {
    expect(matchesTokenPrefix('Wieczór Komedii', 'balet')).toBe(false)
  })

  it('returns true for an empty query', () => {
    expect(matchesTokenPrefix('Wieczór Komedii', '')).toBe(true)
  })
})

describe('uniqueById', () => {
  it('removes duplicate ids while preserving the first occurrence order', () => {
    const items = [
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
      { id: 'a', value: 3 },
    ]

    expect(uniqueById(items)).toEqual([
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
    ])
  })

  it('returns an empty array unchanged', () => {
    expect(uniqueById([])).toEqual([])
  })
})

describe('limitSearchResults', () => {
  it('defaults to a limit of 8 items', () => {
    const items = Array.from({ length: 12 }, (_, index) => index)

    expect(limitSearchResults(items)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('respects a custom limit', () => {
    expect(limitSearchResults([1, 2, 3, 4, 5], 2)).toEqual([1, 2])
  })

  it('returns all items when the limit exceeds the array length', () => {
    expect(limitSearchResults([1, 2], 10)).toEqual([1, 2])
  })
})
