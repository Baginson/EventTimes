import { CalendarDays, MapPin } from 'lucide-react'
import type { SearchMode } from '../data/searchFilters'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import type { EventStatus } from '../utils/eventStatus'
import { formatEventDate, getEventStartTime, getEventStatus } from '../utils/eventStatus'
import { formatVenueAddress, getVenueDisplayName } from '../utils/venueDisplay'

export type EventSearchResult = {
  event: EventTimesEvent
  venue: Venue
}

type SearchResultsProps = {
  mode: SearchMode
  isFilteringActive: boolean
  venues: Venue[]
  events: EventSearchResult[]
  onVenueSelect: (venue: Venue) => void
  onEventSelect: (event: EventTimesEvent, venue: Venue) => void
}

type EventResultGroup = {
  id: EventStatus
  title: string
  results: EventSearchResult[]
}

function sortAscendingByStart(first: EventSearchResult, second: EventSearchResult) {
  return getEventStartTime(first.event) - getEventStartTime(second.event)
}

function sortDescendingByStart(first: EventSearchResult, second: EventSearchResult) {
  return getEventStartTime(second.event) - getEventStartTime(first.event)
}

function groupEventResults(events: EventSearchResult[]): EventResultGroup[] {
  const grouped = {
    ongoing: [] as EventSearchResult[],
    upcoming: [] as EventSearchResult[],
    past: [] as EventSearchResult[],
  }

  for (const result of events) {
    grouped[getEventStatus(result.event)].push(result)
  }

  grouped.ongoing.sort(sortAscendingByStart)
  grouped.upcoming.sort(sortAscendingByStart)
  grouped.past.sort(sortDescendingByStart)

  const groups: EventResultGroup[] = [
    {
      id: 'ongoing',
      title: 'Trwa teraz',
      results: grouped.ongoing,
    },
    {
      id: 'upcoming',
      title: 'Nadchodzące',
      results: grouped.upcoming,
    },
    {
      id: 'past',
      title: 'Minione',
      results: grouped.past,
    },
  ]

  return groups.filter((group) => group.results.length > 0)
}

export function SearchResults({
  mode,
  isFilteringActive,
  venues,
  events,
  onVenueSelect,
  onEventSelect,
}: SearchResultsProps) {
  const hasResults = mode === 'venues' ? venues.length > 0 : events.length > 0
  const eventGroups = mode === 'events' ? groupEventResults(events) : []

  if (!isFilteringActive) {
    return (
      <div className="empty-state search-empty">
        <strong>Zacznij szukać</strong>
        <p>Wpisz nazwę, wybierz typ albo ustaw datę.</p>
      </div>
    )
  }

  if (!hasResults) {
    return (
      <div className="empty-state search-empty">
        <strong>Brak wyników</strong>
        <p>
          {mode === 'events'
            ? 'Zmień frazę, typ wydarzenia albo datę.'
            : 'Zmień frazę, miasto albo typ miejsca.'}
        </p>
      </div>
    )
  }

  return (
    <div className="search-results">
      {mode === 'venues' ? (
        <section className="search-results-group" aria-labelledby="venue-results-title">
          <h3 id="venue-results-title">
            Miejsca <span>{venues.length}</span>
          </h3>
          <ul>
            {venues.map((venue) => (
              <li key={venue.id}>
                <button type="button" onClick={() => onVenueSelect(venue)}>
                  <span className="result-icon result-icon-venue" aria-hidden="true">
                    <MapPin className="ui-icon" />
                  </span>
                  <span className="search-result-copy">
                    <strong>{getVenueDisplayName(venue)}</strong>
                    <small>{formatVenueAddress(venue)}</small>
                  </span>
                  <span className="search-result-chip">{venue.venueType}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        eventGroups.map((group) => (
          <section
            className={`search-results-group search-event-group search-event-group-${group.id}`}
            aria-labelledby={`event-results-${group.id}-title`}
            key={group.id}
          >
            <h3 id={`event-results-${group.id}-title`}>
              {group.title} <span>{group.results.length}</span>
            </h3>
            <ul>
              {group.results.map(({ event, venue }) => (
                <li
                  className={group.id === 'past' ? 'search-event-result-past' : undefined}
                  key={event.id}
                >
                  <button type="button" onClick={() => onEventSelect(event, venue)}>
                    <span className="result-icon result-icon-event" aria-hidden="true">
                      <CalendarDays className="ui-icon" />
                    </span>
                    <span className="search-result-copy">
                      <strong>{event.name}</strong>
                      <small>
                        {formatEventDate(event.startDate)} · {getVenueDisplayName(venue)}
                      </small>
                    </span>
                    <span className="search-result-chip">{event.eventType}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
