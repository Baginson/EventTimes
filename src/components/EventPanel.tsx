import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'

type EventPanelProps = {
  event: EventTimesEvent
  venue: Venue
  onBack: () => void
  onClose: () => void
}

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'long',
  timeStyle: 'short',
})

export function EventPanel({ event, venue, onBack, onClose }: EventPanelProps) {
  return (
    <aside
      className="venue-panel event-panel"
      aria-label={`Szczegóły wydarzenia: ${event.name}`}
    >
      <div className="venue-panel-handle" aria-hidden="true" />
      <button
        className="venue-panel-close"
        type="button"
        onClick={onClose}
        aria-label="Zamknij panel wydarzenia"
      >
        ×
      </button>

      <div className="venue-panel-content">
        <button className="event-back-button" type="button" onClick={onBack}>
          ← Wróć do miejsca
        </button>

        <header className="event-panel-header">
          <span className="event-type-badge">{event.eventType}</span>
          <h1>{event.name}</h1>
        </header>

        <section className="event-schedule" aria-labelledby="event-schedule-title">
          <h2 id="event-schedule-title">Termin</h2>
          <dl className="event-detail-list">
            <div>
              <dt>Start</dt>
              <dd>
                <time dateTime={event.startDate}>
                  {dateFormatter.format(new Date(event.startDate))}
                </time>
              </dd>
            </div>
            {event.endDate && (
              <div>
                <dt>Koniec</dt>
                <dd>
                  <time dateTime={event.endDate}>
                    {dateFormatter.format(new Date(event.endDate))}
                  </time>
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="event-location" aria-labelledby="event-location-title">
          <h2 id="event-location-title">Miejsce</h2>
          <div className="event-location-card">
            <strong>{venue.name}</strong>
            <p>{venue.address}</p>
          </div>
        </section>

        <section className="event-description" aria-labelledby="event-description-title">
          <h2 id="event-description-title">O wydarzeniu</h2>
          <p>{event.description}</p>
        </section>

        {event.sourceUrl && (
          <a
            className="event-source-link"
            href={event.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Zobacz źródło wydarzenia ↗
          </a>
        )}

        <section className="future-actions" aria-labelledby="future-actions-title">
          <h2 id="future-actions-title">Akcje</h2>
          <div className="future-actions-grid">
            {event.ticketUrl ? (
              <a
                className="event-action event-action-primary"
                href={event.ticketUrl}
                target="_blank"
                rel="noreferrer"
              >
                Kup bilet
              </a>
            ) : (
              <button className="event-action-unavailable" type="button" disabled>
                Brak linku do biletu
              </button>
            )}
            <button type="button" disabled title="Funkcja będzie dostępna później">
              Chcę iść
            </button>
            <button type="button" disabled title="Funkcja będzie dostępna później">
              Byłem
            </button>
            <button type="button" disabled title="Funkcja będzie dostępna później">
              Zapisz
            </button>
          </div>
          <p>Funkcje użytkownika będą dostępne w późniejszym etapie.</p>
        </section>
      </div>
    </aside>
  )
}
