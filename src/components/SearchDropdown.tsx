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
import { SearchModeTabs } from './SearchModeTabs'
import { SearchResults } from './SearchResults'
import { VenueTypeFilter } from './VenueTypeFilter'

type SearchDropdownProps = {
  mode: SearchMode
  query: string
  selectedCity: string
  venueType: VenueTypeFilterValue
  eventType: EventTypeFilter
  dateFilter: EventDateFilter
  venues: Venue[]
  events: EventTimesEvent[]
  onModeChange: (mode: SearchMode) => void
  onCityChange: (city: string) => void
  onVenueTypeChange: (venueType: VenueTypeFilterValue) => void
  onEventTypeChange: (eventType: EventTypeFilter) => void
  onDateFilterChange: (dateFilter: EventDateFilter) => void
  onVenueSelect: (venue: Venue) => void
  onEventSelect: (event: EventTimesEvent, venue: Venue) => void
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

function eventMatchesDate(event: EventTimesEvent, filter: EventDateFilter) {
  if (filter === 'Wszystkie' || filter === 'Wybierz datę') {
    return true
  }

  const now = new Date()
  const rangeStart = new Date(now)
  rangeStart.setHours(0, 0, 0, 0)

  if (filter === 'Weekend') {
    const day = rangeStart.getDay()
    const daysUntilSaturday = day === 0 ? -1 : day === 6 ? 0 : 6 - day
    rangeStart.setDate(rangeStart.getDate() + daysUntilSaturday)
  }

  const rangeEnd = new Date(rangeStart)
  rangeEnd.setDate(rangeEnd.getDate() + (filter === 'Weekend' ? 2 : 1))

  const eventStart = new Date(event.startDate)
  const eventEnd = new Date(event.endDate ?? event.startDate)

  return eventStart < rangeEnd && eventEnd >= rangeStart
}

export function SearchDropdown({
  mode,
  query,
  selectedCity,
  venueType,
  eventType,
  dateFilter,
  venues,
  events,
  onModeChange,
  onCityChange,
  onVenueTypeChange,
  onEventTypeChange,
  onDateFilterChange,
  onVenueSelect,
  onEventSelect,
}: SearchDropdownProps) {
  const hasQuery = normalize(query).length > 0
  const venuesInCity = venues.filter(
    (venue) => normalize(venue.city) === normalize(selectedCity),
  )

  const venueResults =
    mode === 'venues'
      ? venuesInCity.filter((venue) => {
          const matchesQuery = !hasQuery || matchesName(venue.name, query)
          const matchesType =
            venueType === 'Wszystkie' ||
            normalize(venue.venueType) === normalize(venueType)

          return matchesQuery && matchesType
        })
      : []

  const eventResults =
    mode === 'events'
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

            return matchesQuery && matchesType && eventMatchesDate(event, dateFilter)
          })
      : []

  return (
    <div className="search-dropdown">
      <SearchModeTabs value={mode} onChange={onModeChange} />

      <div className="search-filters">
        <CityFilter value={selectedCity} onChange={onCityChange} />
        {mode === 'venues' ? (
          <VenueTypeFilter value={venueType} onChange={onVenueTypeChange} />
        ) : (
          <EventFilters
            eventType={eventType}
            dateFilter={dateFilter}
            onEventTypeChange={onEventTypeChange}
            onDateFilterChange={onDateFilterChange}
          />
        )}
      </div>

      <SearchResults
        mode={mode}
        venues={venueResults}
        events={eventResults}
        onVenueSelect={onVenueSelect}
        onEventSelect={onEventSelect}
      />
    </div>
  )
}
