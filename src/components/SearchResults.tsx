import type { SearchMode } from '../data/searchFilters'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'

export type EventSearchResult = {
  event: EventTimesEvent
  venue: Venue
}

type SearchResultsProps = {
  mode: SearchMode
  venues: Venue[]
  events: EventSearchResult[]
  onVenueSelect: (venue: Venue) => void
  onEventSelect: (event: EventTimesEvent, venue: Venue) => void
}

export function SearchResults({
  mode,
  venues,
  events,
  onVenueSelect,
  onEventSelect,
}: SearchResultsProps) {
  const hasResults = mode === 'venues' ? venues.length > 0 : events.length > 0

  if (!hasResults) {
    return (
      <p className="search-empty">
        {mode === 'venues'
          ? 'Brak pasujących miejsc.'
          : 'Brak pasujących wydarzeń.'}
      </p>
    )
  }

  return (
    <div className="search-results">
      {mode === 'venues' ? (
        <section className="search-results-group" aria-labelledby="venue-results-title">
          <h3 id="venue-results-title">Miejsca ({venues.length})</h3>
          <ul>
            {venues.map((venue) => (
              <li key={venue.id}>
                <button type="button" onClick={() => onVenueSelect(venue)}>
                  <span className="result-icon" aria-hidden="true">
                    M
                  </span>
                  <span>
                    <strong>{venue.name}</strong>
                    <small>
                      {venue.venueType} · {venue.address}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="search-results-group" aria-labelledby="event-results-title">
          <h3 id="event-results-title">Wydarzenia ({events.length})</h3>
          <ul>
            {events.map(({ event, venue }) => (
              <li key={event.id}>
                <button type="button" onClick={() => onEventSelect(event, venue)}>
                  <span className="result-icon result-icon-event" aria-hidden="true">
                    E
                  </span>
                  <span>
                    <strong>{event.name}</strong>
                    <small>
                      {event.eventType} · {venue.name}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
