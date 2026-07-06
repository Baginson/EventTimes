import type { EventTimesEvent } from '../data/mockEvents'

export type EventStatus = 'upcoming' | 'ongoing' | 'past'

export function getEventStatus(event: EventTimesEvent, now = new Date()): EventStatus {
  const startDate = new Date(event.startDate)

  if (startDate > now) {
    return 'upcoming'
  }

  if (!event.endDate) {
    return 'past'
  }

  const endDate = new Date(event.endDate)
  return endDate >= now ? 'ongoing' : 'past'
}
