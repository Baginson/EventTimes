import { useEffect, useState } from 'react'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { VenueForm } from './VenueForm'

type VenuePanelProps = {
  venue: Venue
  events: EventTimesEvent[]
  isAdminMode: boolean
  isPinMoveActive: boolean
  onEventSelect: (event: EventTimesEvent) => void
  onUpdateVenue: (venue: Venue) => void
  onDeleteVenue: () => void
  onMoveVenue: () => void
  onClose: () => void
}

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function VenuePanel({
  venue,
  events,
  isAdminMode,
  isPinMoveActive,
  onEventSelect,
  onUpdateVenue,
  onDeleteVenue,
  onMoveVenue,
  onClose,
}: VenuePanelProps) {
  const [isEditingVenue, setIsEditingVenue] = useState(false)

  useEffect(() => {
    setIsEditingVenue(false)
  }, [venue.id])

  function saveVenue(updatedVenue: Venue) {
    onUpdateVenue(updatedVenue)
    setIsEditingVenue(false)
  }

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
        {isEditingVenue ? (
          <div className="context-edit-view">
            <header className="context-edit-header">
              <span>Tryb admina</span>
              <h1>Edytuj miejsce</h1>
            </header>
            <VenueForm
              key={venue.id}
              initialVenue={venue}
              onSave={saveVenue}
              onCancel={() => setIsEditingVenue(false)}
            />
          </div>
        ) : (
          <>
            <span className="venue-type">{venue.venueType}</span>
            <h1>{venue.name}</h1>
            <p className="venue-address">{venue.address}</p>
            <p className="venue-description">{venue.description}</p>

            {isAdminMode && (
              <section className="inline-admin-actions" aria-label="Akcje administratora miejsca">
                <span>Tryb admina</span>
                <div>
                  <button type="button" onClick={() => setIsEditingVenue(true)}>
                    Edytuj miejsce
                  </button>
                  <button type="button" onClick={onMoveVenue} disabled={isPinMoveActive}>
                    {isPinMoveActive ? 'Przesuwanie…' : 'Przesuń pinezkę'}
                  </button>
                  <button className="inline-admin-danger" type="button" onClick={onDeleteVenue}>
                    Usuń miejsce
                  </button>
                </div>
              </section>
            )}

            <section className="events-section">
              <div className="events-heading">
                <h2>Wydarzenia</h2>
                <span>{events.length}</span>
              </div>

              {events.length > 0 ? (
                <ul className="event-list">
                  {events.map((event) => (
                    <li className="event-card" key={event.id}>
                      <button
                        className="event-card-main"
                        type="button"
                        onClick={() => onEventSelect(event)}
                      >
                        <span className="event-poster-placeholder" aria-hidden="true">
                          <span>{event.eventType}</span>
                          <strong>{event.name}</strong>
                        </span>
                        <span className="event-meta">
                          <span>{event.eventType}</span>
                          <time dateTime={event.startDate}>
                            {dateFormatter.format(new Date(event.startDate))}
                          </time>
                        </span>
                        <strong>{event.name}</strong>
                        <span className="event-card-description">{event.description}</span>
                        <span className="event-details-link">Zobacz szczegóły →</span>
                      </button>
                      {event.ticketUrl && (
                        <a href={event.ticketUrl} target="_blank" rel="noreferrer">
                          Kup bilet
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state empty-events">
                  <span className="empty-state-icon" aria-hidden="true">ET</span>
                  <strong>Brak wydarzeń</strong>
                  <p>To miejsce nie ma jeszcze dodanych eventów.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </aside>
  )
}
