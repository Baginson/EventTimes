import type {
  EventDateFilter,
  EventTypeFilter,
  SearchMode,
  VenueTypeFilter as VenueTypeFilterValue,
} from '../data/searchFilters'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { CityFilter } from './CityFilter'
import { EventFilters } from './EventFilters'
import type { CustomDateMode } from './EventFilters'
import { SearchModeTabs } from './SearchModeTabs'
import { SearchResults } from './SearchResults'
import { VenueTypeFilter } from './VenueTypeFilter'
import {
  getEventStartTime,
  hasExplicitEventTime,
  parseEventDate,
} from '../utils/eventStatus'
import { getVenueDisplayName } from '../utils/venueDisplay'

type SearchDropdownProps = {
  mode: SearchMode
  query: string
  selectedCity: string
  venueType: VenueTypeFilterValue
  eventType: EventTypeFilter
  dateFilter: EventDateFilter
  customDateMode: CustomDateMode
  customDate: string
  customDateFrom: string
  customDateTo: string
  venues: Venue[]
  events: EventTimesEvent[]
  onModeChange: (mode: SearchMode) => void
  onCityChange: (city: string) => void
  onVenueTypeChange: (venueType: VenueTypeFilterValue) => void
  onEventTypeChange: (eventType: EventTypeFilter) => void
  onDateFilterChange: (dateFilter: EventDateFilter) => void
  onCustomDateModeChange: (mode: CustomDateMode) => void
  onCustomDateChange: (date: string) => void
  onCustomDateFromChange: (date: string) => void
  onCustomDateToChange: (date: string) => void
  onVenueSelect: (venue: Venue) => void
  onEventSelect: (event: EventTimesEvent, venue: Venue) => void
}

type DateRange = {
  start: Date
  end: Date
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pl-PL')
    .replace(/ł/g, 'l')
    .trim()
}

function matchesName(name: string, query: string) {
  const nameTokens = normalize(name).split(/[^a-z0-9]+/).filter(Boolean)
  const queryTokens = normalize(query).split(/[^a-z0-9]+/).filter(Boolean)

  return queryTokens.every((queryToken) =>
    nameTokens.some((nameToken) => nameToken.startsWith(queryToken)),
  )
}

function startOfLocalDay(date: Date) {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function createLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

function createDayRange(value: string): DateRange | null {
  const date = createLocalDate(value)

  if (!date) {
    return null
  }

  const start = startOfLocalDay(date)
  return { start, end: addDays(start, 1) }
}

function getWeekendRange(now = new Date()): DateRange {
  const today = startOfLocalDay(now)
  const day = today.getDay()
  const daysUntilSaturday = day === 0 ? -1 : day === 6 ? 0 : 6 - day
  const start = addDays(today, daysUntilSaturday)
  return { start, end: addDays(start, 2) }
}

function getDateFilterRange(
  filter: EventDateFilter,
  customDateMode: CustomDateMode,
  customDate: string,
  customDateFrom: string,
  customDateTo: string,
): DateRange | null {
  const today = startOfLocalDay(new Date())

  if (filter === 'Dzisiaj') {
    return { start: today, end: addDays(today, 1) }
  }

  if (filter === 'Jutro') {
    const tomorrow = addDays(today, 1)
    return { start: tomorrow, end: addDays(tomorrow, 1) }
  }

  if (filter === 'Weekend') {
    return getWeekendRange()
  }

  if (filter !== 'Wybierz datę') {
    return null
  }

  if (customDateMode === 'single') {
    return createDayRange(customDate)
  }

  const rangeStart = createLocalDate(customDateFrom)
  const rangeEnd = createLocalDate(customDateTo)

  if (!rangeStart || !rangeEnd) {
    return null
  }

  const start = startOfLocalDay(rangeStart <= rangeEnd ? rangeStart : rangeEnd)
  const endSource = rangeStart <= rangeEnd ? rangeEnd : rangeStart

  return { start, end: addDays(startOfLocalDay(endSource), 1) }
}

function getEventDateRange(event: EventTimesEvent): DateRange | null {
  const start = parseEventDate(event.startDate)

  if (!start) {
    return null
  }

  const parsedEnd = parseEventDate(event.endDate ?? event.startDate)
  const eventHasExplicitEnd = event.endDate && hasExplicitEventTime(event.endDate)
  const end =
    parsedEnd && eventHasExplicitEnd
      ? parsedEnd
      : parsedEnd && event.endDate
        ? addDays(startOfLocalDay(parsedEnd), 1)
        : hasExplicitEventTime(event.startDate)
          ? start
          : addDays(startOfLocalDay(start), 1)

  return { start, end }
}

function eventOverlapsRange(event: EventTimesEvent, range: DateRange) {
  const eventRange = getEventDateRange(event)

  if (!eventRange) {
    return false
  }

  return eventRange.start < range.end && eventRange.end >= range.start
}

export function SearchDropdown({
  mode,
  query,
  selectedCity,
  venueType,
  eventType,
  dateFilter,
  customDateMode,
  customDate,
  customDateFrom,
  customDateTo,
  venues,
  events,
  onModeChange,
  onCityChange,
  onVenueTypeChange,
  onEventTypeChange,
  onDateFilterChange,
  onCustomDateModeChange,
  onCustomDateChange,
  onCustomDateFromChange,
  onCustomDateToChange,
  onVenueSelect,
  onEventSelect,
}: SearchDropdownProps) {
  const normalizedQuery = normalize(query)
  const hasQuery = normalizedQuery.length >= 2
  const dateRange = getDateFilterRange(
    dateFilter,
    customDateMode,
    customDate,
    customDateFrom,
    customDateTo,
  )
  const hasActiveVenueFiltering = hasQuery || venueType !== 'Wszystkie'
  const hasActiveEventFiltering =
    hasQuery || eventType !== 'Wszystkie' || dateRange !== null
  const venuesInCity = venues.filter(
    (venue) => normalize(venue.city) === normalize(selectedCity),
  )

  const venueResults =
    mode === 'venues' && hasActiveVenueFiltering
      ? venuesInCity
          .filter((venue) => {
            const matchesQuery = !hasQuery || matchesName(getVenueDisplayName(venue), query)
            const matchesType =
              venueType === 'Wszystkie' ||
              normalize(venue.venueType) === normalize(venueType)

            return matchesQuery && matchesType
          })
          .sort((firstVenue, secondVenue) =>
            getVenueDisplayName(firstVenue).localeCompare(
              getVenueDisplayName(secondVenue),
              'pl-PL',
            ),
          )
      : []

  const eventResults =
    mode === 'events' && hasActiveEventFiltering
      ? events
          .map((event) => ({
            event,
            venue: venuesInCity.find((venue) => venue.id === event.venueId),
          }))
          .filter(
            (result): result is { event: EventTimesEvent; venue: Venue } =>
              result.venue !== undefined,
          )
          .filter(({ event }) => {
            const matchesQuery = !hasQuery || matchesName(event.name, query)
            const matchesType =
              eventType === 'Wszystkie' ||
              normalize(event.eventType) === normalize(eventType)
            const matchesDate = !dateRange || eventOverlapsRange(event, dateRange)

            return matchesQuery && matchesType && matchesDate
          })
          .sort(
            (firstResult, secondResult) =>
              getEventStartTime(firstResult.event) - getEventStartTime(secondResult.event),
          )
      : []

  const isFilteringActive =
    mode === 'venues' ? hasActiveVenueFiltering : hasActiveEventFiltering

  return (
    <div className="search-dropdown">
      <div className="search-discovery-strip" aria-hidden="true">
        <strong>Odkrywaj</strong>
        <span>Miejsca / wydarzenia / historia miasta</span>
      </div>
      <SearchModeTabs value={mode} onChange={onModeChange} />

      <div className="search-filters">
        <CityFilter value={selectedCity} onChange={onCityChange} />
        {mode === 'venues' ? (
          <VenueTypeFilter value={venueType} onChange={onVenueTypeChange} />
        ) : (
          <EventFilters
            eventType={eventType}
            dateFilter={dateFilter}
            customDateMode={customDateMode}
            customDate={customDate}
            customDateFrom={customDateFrom}
            customDateTo={customDateTo}
            onEventTypeChange={onEventTypeChange}
            onDateFilterChange={onDateFilterChange}
            onCustomDateModeChange={onCustomDateModeChange}
            onCustomDateChange={onCustomDateChange}
            onCustomDateFromChange={onCustomDateFromChange}
            onCustomDateToChange={onCustomDateToChange}
          />
        )}
      </div>

      <SearchResults
        mode={mode}
        isFilteringActive={isFilteringActive}
        venues={venueResults}
        events={eventResults}
        onVenueSelect={onVenueSelect}
        onEventSelect={onEventSelect}
      />
    </div>
  )
}
