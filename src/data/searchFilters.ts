export const VENUE_TYPES = [
  'Wszystkie',
  'Dom kultury',
  'Hala',
  'Aula',
  'Sala koncertowa',
  'Stadion',
  'Plener',
  'Klub',
  'Teatr',
  'Biblioteka',
  'Bar / pub',
  'Inne',
] as const

export const EVENT_TYPES = [
  'Wszystkie',
  'Koncert',
  'Sport',
  'Stand-up',
  'Teatr',
  'Spektakl',
  'Targi',
  'Festiwal',
  'Spotkanie',
  'E-sport',
  'Inne',
] as const

export const EVENT_DATE_FILTERS = [
  'Wszystkie',
  'Dzisiaj',
  'Jutro',
  'Weekend',
  'Wybierz datę',
] as const

export type SearchMode = 'venues' | 'events'
export type VenueTypeFilter = (typeof VENUE_TYPES)[number]
export type EventTypeFilter = (typeof EVENT_TYPES)[number]
export type EventDateFilter = (typeof EVENT_DATE_FILTERS)[number]
