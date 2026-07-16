import { describe, expect, it } from 'vitest'
import type { EventTimesEvent } from '../data/mockEvents'
import {
  formatEventDate,
  getEventStatus,
  hasExplicitEventTime,
  parseDateOnly,
  parseEventDate,
} from './eventStatus'

function buildEvent(overrides: Partial<EventTimesEvent> = {}): EventTimesEvent {
  return {
    id: 'test-event',
    venueId: 'test-venue',
    name: 'Testowe wydarzenie',
    eventType: 'Koncert',
    description: 'Opis testowego wydarzenia.',
    startDate: '2026-07-18T18:00:00+02:00',
    ...overrides,
  }
}

describe('parseDateOnly', () => {
  it('parses a YYYY-MM-DD string into a local Date at midnight', () => {
    const date = parseDateOnly('2026-07-18')

    expect(date).not.toBeNull()
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(6)
    expect(date?.getDate()).toBe(18)
    expect(date?.getHours()).toBe(0)
  })

  it('returns null for strings that are not date-only', () => {
    expect(parseDateOnly('2026-07-18T18:00:00+02:00')).toBeNull()
    expect(parseDateOnly('not-a-date')).toBeNull()
  })
})

describe('parseEventDate', () => {
  it('returns null when no value is provided', () => {
    expect(parseEventDate(undefined)).toBeNull()
  })

  it('returns null for an invalid date string', () => {
    expect(parseEventDate('not-a-date')).toBeNull()
  })

  it('parses a full ISO datetime string', () => {
    const date = parseEventDate('2026-07-18T18:00:00+02:00')

    expect(date).not.toBeNull()
    expect(date?.getTime()).toBe(new Date('2026-07-18T18:00:00+02:00').getTime())
  })

  it('parses a date-only "YYYY-MM-DD" string as a local date', () => {
    const date = parseEventDate('2026-07-18')

    expect(date).not.toBeNull()
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(6)
    expect(date?.getDate()).toBe(18)
  })
})

describe('hasExplicitEventTime', () => {
  it('returns false when no value is provided', () => {
    expect(hasExplicitEventTime(undefined)).toBe(false)
  })

  it('returns false for a date-only string', () => {
    expect(hasExplicitEventTime('2026-07-18')).toBe(false)
  })

  it('returns false when the time component is midnight', () => {
    expect(hasExplicitEventTime('2026-07-18T00:00:00+02:00')).toBe(false)
  })

  it('returns true when the time component is not midnight', () => {
    expect(hasExplicitEventTime('2026-07-18T18:30:00+02:00')).toBe(true)
  })
})

describe('formatEventDate', () => {
  it('formats a date-only value without a time part', () => {
    expect(formatEventDate('2026-07-18')).toBe('18 lip 2026')
  })

  it('formats a datetime value with an explicit time using the short time style', () => {
    expect(formatEventDate('2026-07-18T18:00:00+02:00')).toBe('18 lip 2026, 18:00')
  })

  it('respects the long dateStyle option', () => {
    expect(formatEventDate('2026-07-18', 'long')).toBe('18 lipca 2026')
  })

  it('falls back to a Polish placeholder for an invalid date string', () => {
    expect(formatEventDate('not-a-date')).toBe('Bez poprawnej daty')
  })
})

describe('getEventStatus', () => {
  const now = new Date('2026-07-18T12:00:00+02:00')

  it('returns "upcoming" when the start date is in the future', () => {
    const event = buildEvent({ startDate: '2026-07-19T18:00:00+02:00' })

    expect(getEventStatus(event, now)).toBe('upcoming')
  })

  it('returns "ongoing" when now falls between the start and end dates', () => {
    const event = buildEvent({
      startDate: '2026-07-18T10:00:00+02:00',
      endDate: '2026-07-18T20:00:00+02:00',
    })

    expect(getEventStatus(event, now)).toBe('ongoing')
  })

  it('returns "past" when now is after the end date', () => {
    const event = buildEvent({
      startDate: '2026-07-17T10:00:00+02:00',
      endDate: '2026-07-17T20:00:00+02:00',
    })

    expect(getEventStatus(event, now)).toBe('past')
  })

  it('returns "past" when the start date is in the past and there is no end date', () => {
    const event = buildEvent({ startDate: '2026-07-17T10:00:00+02:00', endDate: undefined })

    expect(getEventStatus(event, now)).toBe('past')
  })

  it('returns "past" when the start date cannot be parsed', () => {
    const event = buildEvent({ startDate: 'not-a-date' })

    expect(getEventStatus(event, now)).toBe('past')
  })

  it('returns "past" when the end date cannot be parsed', () => {
    const event = buildEvent({
      startDate: '2026-07-17T10:00:00+02:00',
      endDate: 'not-a-date',
    })

    expect(getEventStatus(event, now)).toBe('past')
  })
})
