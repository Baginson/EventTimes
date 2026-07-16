import { describe, expect, it } from 'vitest'
import type { CompatibleEvent } from './eventModel'
import { createEventExternalImage, getEventTitle } from './eventModel'

function buildEvent(overrides: Partial<CompatibleEvent> = {}): CompatibleEvent {
  return {
    id: 'test-event',
    venueId: 'test-venue',
    name: 'Nazwa domyślna',
    eventType: 'Koncert',
    description: 'Opis testowego wydarzenia.',
    startDate: '2026-07-18T18:00:00+02:00',
    ...overrides,
  }
}

describe('getEventTitle', () => {
  it('prefers a trimmed title over the name', () => {
    expect(getEventTitle(buildEvent({ title: '  Tytuł wydarzenia  ' }))).toBe('Tytuł wydarzenia')
  })

  it('falls back to the name when title is undefined', () => {
    expect(getEventTitle(buildEvent({ title: undefined, name: 'Nazwa domyślna' }))).toBe(
      'Nazwa domyślna',
    )
  })

  it('falls back to the name when title is empty or whitespace-only', () => {
    expect(getEventTitle(buildEvent({ title: '   ', name: 'Nazwa domyślna' }))).toBe(
      'Nazwa domyślna',
    )
  })
})

describe('createEventExternalImage', () => {
  it('creates an external cover image with the expected id and metadata', () => {
    const image = createEventExternalImage('test-event', 'https://example.com/cover.jpg', 'Koncert')

    expect(image).toEqual({
      id: 'test-event-cover',
      url: 'https://example.com/cover.jpg',
      alt: 'Koncert',
      type: 'cover',
      source: 'external',
    })
  })

  it('trims the provided title for the alt text', () => {
    const image = createEventExternalImage('test-event', 'https://example.com/cover.jpg', '  Koncert  ')

    expect(image?.alt).toBe('Koncert')
  })

  it('falls back to a default Polish alt text when no title is provided', () => {
    const image = createEventExternalImage('test-event', 'https://example.com/cover.jpg')

    expect(image?.alt).toBe('Zdjecie wydarzenia')
  })

  it('returns undefined when no image URL is provided', () => {
    expect(createEventExternalImage('test-event', undefined, 'Koncert')).toBeUndefined()
  })

  it('returns undefined when the image URL is blank', () => {
    expect(createEventExternalImage('test-event', '   ', 'Koncert')).toBeUndefined()
  })
})
