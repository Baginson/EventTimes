import { mockEvents } from '../data/mockEvents'
import type { EventTimesEvent } from '../data/mockEvents'

const EVENTS_STORAGE_KEY = 'event-times.events.v1'

function cloneStarterEvents(): EventTimesEvent[] {
  return mockEvents.map((event) => ({ ...event }))
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string'
}

function isEvent(value: unknown): value is EventTimesEvent {
  if (!value || typeof value !== 'object') {
    return false
  }

  const event = value as Partial<EventTimesEvent>

  return (
    typeof event.id === 'string' &&
    typeof event.venueId === 'string' &&
    typeof event.name === 'string' &&
    typeof event.eventType === 'string' &&
    typeof event.description === 'string' &&
    typeof event.startDate === 'string' &&
    isOptionalString(event.endDate) &&
    isOptionalString(event.ticketUrl) &&
    isOptionalString(event.sourceUrl) &&
    isOptionalString(event.imageUrl)
  )
}

function persistEvents(events: EventTimesEvent[]) {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
}

export function getEvents(): EventTimesEvent[] {
  if (typeof localStorage === 'undefined') {
    return cloneStarterEvents()
  }

  try {
    const storedValue = localStorage.getItem(EVENTS_STORAGE_KEY)

    if (storedValue === null) {
      return cloneStarterEvents()
    }

    const parsedValue: unknown = JSON.parse(storedValue)
    return Array.isArray(parsedValue) && parsedValue.every(isEvent)
      ? parsedValue
      : cloneStarterEvents()
  } catch {
    return cloneStarterEvents()
  }
}

export function saveEvent(event: EventTimesEvent): EventTimesEvent[] {
  const events = getEvents()

  if (events.some((existingEvent) => existingEvent.id === event.id)) {
    throw new Error('Wydarzenie z tym identyfikatorem już istnieje.')
  }

  const updatedEvents = [...events, event]
  persistEvents(updatedEvents)
  return updatedEvents
}

export function updateEvent(updatedEvent: EventTimesEvent): EventTimesEvent[] {
  const events = getEvents()

  if (!events.some((event) => event.id === updatedEvent.id)) {
    throw new Error('Nie znaleziono wydarzenia do aktualizacji.')
  }

  const updatedEvents = events.map((event) =>
    event.id === updatedEvent.id ? updatedEvent : event,
  )
  persistEvents(updatedEvents)
  return updatedEvents
}

export function deleteEvent(eventId: string): EventTimesEvent[] {
  const updatedEvents = getEvents().filter((event) => event.id !== eventId)
  persistEvents(updatedEvents)
  return updatedEvents
}

export function deleteEventsByVenueId(venueId: string): EventTimesEvent[] {
  const updatedEvents = getEvents().filter((event) => event.venueId !== venueId)
  persistEvents(updatedEvents)
  return updatedEvents
}

export function replaceEvents(events: EventTimesEvent[]): EventTimesEvent[] {
  const nextEvents = events.map((event) => ({ ...event }))
  persistEvents(nextEvents)
  return nextEvents
}

export function clearStoredEvents(): EventTimesEvent[] {
  localStorage.removeItem(EVENTS_STORAGE_KEY)
  return cloneStarterEvents()
}
