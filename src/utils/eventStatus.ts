import type { EventTimesEvent } from '../data/mockEvents'

export type EventStatus = 'upcoming' | 'ongoing' | 'past'

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

export function parseEventDate(value?: string) {
  if (!value) {
    return null
  }

  const date = parseDateOnly(value) ?? new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function hasExplicitEventTime(value?: string) {
  if (!value) {
    return false
  }

  const timeMatch = /T(\d{2}):(\d{2})/.exec(value)

  if (!timeMatch) {
    return false
  }

  const [, hour, minute] = timeMatch

  return hour !== '00' || minute !== '00'
}

export function formatEventDate(value: string, dateStyle: 'medium' | 'long' = 'medium') {
  const date = parseEventDate(value)

  if (!date) {
    return 'Bez poprawnej daty'
  }

  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle,
    ...(hasExplicitEventTime(value) ? { timeStyle: 'short' as const } : {}),
  }).format(date)
}

export function isEventDateValid(event: EventTimesEvent) {
  return parseEventDate(event.startDate) !== null
}

export function getEventStartTime(event: EventTimesEvent) {
  return parseEventDate(event.startDate)?.getTime() ?? Number.NaN
}

export function getEventStatus(event: EventTimesEvent, now = new Date()): EventStatus {
  const startDate = parseEventDate(event.startDate)

  if (!startDate) {
    return 'past'
  }

  if (startDate > now) {
    return 'upcoming'
  }

  if (!event.endDate) {
    return 'past'
  }

  const endDate = parseEventDate(event.endDate)

  if (!endDate) {
    return 'past'
  }

  return endDate >= now ? 'ongoing' : 'past'
}

export function getEventStatusLabel(status: EventStatus) {
  switch (status) {
    case 'ongoing':
      return 'Trwa teraz'
    case 'upcoming':
      return 'Nadchodzące'
    case 'past':
      return 'Minione'
  }
}
