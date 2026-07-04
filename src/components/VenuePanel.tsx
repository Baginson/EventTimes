import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'

type VenuePanelProps = {
  venue: Venue
  events: EventTimesEvent[]
  onClose: () => void
}

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function VenuePanel({ venue, events, onClose }: VenuePanelProps) {
  return (
    <aside className="venue-panel" aria-label={`Informacje o miejscu: ${venue.name}`}>
      <div className="venue-panel-handle" aria-hidden="true" />
      <button
        className="venue-panel-close"
        type="button"
        onClick={onClose}
        aria-label="Zamknij panel miejsca"
      >
        ×
      </button>

      <div className="venue-panel-content">
        <span className="venue-type">{venue.type}</span>
        <h1>{venue.name}</h1>
        <p className="venue-address">{venue.address}</p>
        <p className="venue-description">{venue.description}</p>

        <section className="events-section">
          <div className="events-heading">
            <h2>Wydarzenia</h2>
            <span>{events.length}</span>
          </div>

          {events.length > 0 ? (
            <ul className="event-list">
              {events.map((event) => (
                <li className="event-card" key={event.id}>
                  <div className="event-meta">
                    <span>{event.category}</span>
                    <time dateTime={event.startDate}>
                      {dateFormatter.format(new Date(event.startDate))}
                    </time>
                  </div>
                  <h3>{event.name}</h3>
                  <p>{event.description}</p>
                  <a href={event.ticketUrl} target="_blank" rel="noreferrer">
                    Kup bilet
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-events">Brak testowych wydarzeń dla tego miejsca.</p>
          )}
        </section>
      </div>
    </aside>
  )
}
