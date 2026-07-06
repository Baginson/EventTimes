import { useEffect, useState } from 'react'
import { useAuth } from '../auth/authContext'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { getVenueAction, toggleVenueSaved } from '../services/userActionService'
import { getVenueGoogleMapsUrl } from '../utils/googleMaps'
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
  const { user } = useAuth()
  const [isEditingVenue, setIsEditingVenue] = useState(false)
  const [isVenueSaved, setIsVenueSaved] = useState(false)
  const [userActionError, setUserActionError] = useState('')

  useEffect(() => {
    setIsEditingVenue(false)
  }, [venue.id])

  useEffect(() => {
    let active = true
    setIsVenueSaved(false)
    setUserActionError('')

    if (user) {
      void getVenueAction(user.uid, venue.id)
        .then((action) => {
          if (active) {
            setIsVenueSaved(action.saved)
          }
        })
        .catch((error: unknown) => {
          if (active) {
            setUserActionError(error instanceof Error ? error.message : 'Nie udało się pobrać zapisu miejsca.')
          }
        })
    }

    return () => {
      active = false
    }
  }, [user, venue.id])

  function saveVenue(updatedVenue: Venue) {
    onUpdateVenue(updatedVenue)
    setIsEditingVenue(false)
  }

  async function handleVenueSave() {
    setUserActionError('')

    try {
      if (!user) {
        return
      }

      const action = await toggleVenueSaved(user.uid, venue.id, isVenueSaved)
      setIsVenueSaved(action.saved)
    } catch (error) {
      setUserActionError(error instanceof Error ? error.message : 'Nie udało się zapisać miejsca.')
    }
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
            <a
              className="navigation-link"
              href={getVenueGoogleMapsUrl(venue)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Nawiguj w Google Maps ↗
            </a>
            {user && (
              <>
                <button
                  className={`venue-save-action${isVenueSaved ? ' is-active' : ''}`}
                  type="button"
                  aria-pressed={isVenueSaved}
                  onClick={() => void handleVenueSave()}
                >
                  <span aria-hidden="true">{isVenueSaved ? '♥' : '♡'}</span>
                  {isVenueSaved ? 'Polubione' : 'Polub'}
                </button>
                {userActionError && <p className="user-action-error" role="alert">{userActionError}</p>}
              </>
            )}
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
