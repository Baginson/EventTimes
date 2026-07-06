import { useEffect, useState } from 'react'
import { useAuth } from '../auth/authContext'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import {
  getEventAction,
  toggleEventAction,
} from '../services/userActionService'
import type { EventAction, EventActionKey } from '../services/userActionService'
import { getEventStatus } from '../utils/eventStatus'
import { getVenueGoogleMapsUrl } from '../utils/googleMaps'
import { EventForm } from './EventForm'

type EventPanelProps = {
  event: EventTimesEvent
  venue: Venue
  venues: Venue[]
  isAdminMode: boolean
  onBack: () => void
  onUpdateEvent: (event: EventTimesEvent) => void
  onDeleteEvent: () => void
  onClose: () => void
}

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'long',
  timeStyle: 'short',
})

export function EventPanel({
  event,
  venue,
  venues,
  isAdminMode,
  onBack,
  onUpdateEvent,
  onDeleteEvent,
  onClose,
}: EventPanelProps) {
  const { user } = useAuth()
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [eventAction, setEventAction] = useState<EventAction>({
    eventId: event.id,
    venueId: event.venueId,
    interested: false,
    going: false,
    visited: false,
    saved: false,
  })
  const [pendingAction, setPendingAction] = useState<EventActionKey | null>(null)
  const [userActionError, setUserActionError] = useState('')
  const eventStatus = getEventStatus(event)

  useEffect(() => {
    setIsEditingEvent(false)
  }, [event.id])

  useEffect(() => {
    let active = true
    const emptyAction: EventAction = {
      eventId: event.id,
      venueId: event.venueId,
      interested: false,
      going: false,
      visited: false,
      saved: false,
    }
    setEventAction(emptyAction)
    setUserActionError('')

    if (user) {
      void getEventAction(user.uid, event)
        .then((action) => {
          if (active) {
            setEventAction(action)
          }
        })
        .catch((error: unknown) => {
          if (active) {
            setUserActionError(error instanceof Error ? error.message : 'Nie udało się pobrać akcji wydarzenia.')
          }
        })
    }

    return () => {
      active = false
    }
  }, [event, user])

  function saveEvent(updatedEvent: EventTimesEvent) {
    onUpdateEvent(updatedEvent)
    setIsEditingEvent(false)
  }

  async function handleUserAction(key: EventActionKey) {
    setUserActionError('')

    try {
      if (!user) {
        return
      }

      setPendingAction(key)
      const nextAction = await toggleEventAction(user.uid, event, key, eventAction)
      setEventAction(nextAction)
    } catch (error) {
      setUserActionError(error instanceof Error ? error.message : 'Nie udało się zapisać akcji.')
    } finally {
      setPendingAction(null)
    }
  }

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
        {isEditingEvent ? (
          <div className="context-edit-view">
            <header className="context-edit-header">
              <span>Tryb admina</span>
              <h1>Edytuj wydarzenie</h1>
            </header>
            <EventForm
              key={event.id}
              venues={venues}
              initialEvent={event}
              onSave={saveEvent}
              onCancel={() => setIsEditingEvent(false)}
            />
          </div>
        ) : (
          <>
            <button className="event-back-button" type="button" onClick={onBack}>
              ← Wróć do miejsca
            </button>

            <header className="event-panel-header">
              <span className="event-type-badge">{event.eventType}</span>
              <h1>{event.name}</h1>
            </header>

            {isAdminMode && (
              <section className="inline-admin-actions" aria-label="Akcje administratora wydarzenia">
                <span>Tryb admina</span>
                <div>
                  <button type="button" onClick={() => setIsEditingEvent(true)}>
                    Edytuj event
                  </button>
                  <button className="inline-admin-danger" type="button" onClick={onDeleteEvent}>
                    Usuń event
                  </button>
                </div>
              </section>
            )}

            <section className="event-schedule" aria-labelledby="event-schedule-title">
              <h2 id="event-schedule-title">Termin</h2>
              <dl className="event-detail-list">
                <div>
                  <dt>Start</dt>
                  <dd><time dateTime={event.startDate}>{dateFormatter.format(new Date(event.startDate))}</time></dd>
                </div>
                {event.endDate && (
                  <div>
                    <dt>Koniec</dt>
                    <dd><time dateTime={event.endDate}>{dateFormatter.format(new Date(event.endDate))}</time></dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="event-location" aria-labelledby="event-location-title">
              <h2 id="event-location-title">Miejsce</h2>
              <div className="event-location-card">
                <strong>{venue.name}</strong>
                <p>{venue.address}</p>
                <a
                  className="navigation-link"
                  href={getVenueGoogleMapsUrl(venue)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Nawiguj w Google Maps ↗
                </a>
              </div>
            </section>

            <section className="event-description" aria-labelledby="event-description-title">
              <h2 id="event-description-title">O wydarzeniu</h2>
              <p>{event.description}</p>
            </section>

            {event.sourceUrl && (
              <a className="event-source-link" href={event.sourceUrl} target="_blank" rel="noreferrer">
                Zobacz źródło wydarzenia ↗
              </a>
            )}

            <section className="future-actions" aria-labelledby="future-actions-title">
              <h2 id="future-actions-title">Akcje</h2>
              {event.ticketUrl ? (
                <a className="event-action event-action-primary" href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                  Kup bilet
                </a>
              ) : (
                <span className="event-ticket-unavailable">Brak linku do biletu</span>
              )}

              {user && (
                <div className="user-event-actions" aria-label="Twoje akcje dla wydarzenia">
                  {eventStatus === 'upcoming' && (
                    <>
                      <button
                        className={eventAction.interested ? 'is-active' : ''}
                        type="button"
                        aria-pressed={eventAction.interested}
                        disabled={pendingAction !== null}
                        onClick={() => void handleUserAction('interested')}
                      >
                        {pendingAction === 'interested' ? 'Zapisywanie…' : 'Zainteresowany'}
                      </button>
                      <button
                        className={eventAction.going ? 'is-active' : ''}
                        type="button"
                        aria-pressed={eventAction.going}
                        disabled={pendingAction !== null}
                        onClick={() => void handleUserAction('going')}
                      >
                        {pendingAction === 'going' ? 'Zapisywanie…' : 'Chcę iść'}
                      </button>
                    </>
                  )}

                  {eventStatus === 'past' && (
                    <button
                      className={eventAction.visited ? 'is-active' : ''}
                      type="button"
                      aria-pressed={eventAction.visited}
                      disabled={pendingAction !== null}
                      onClick={() => void handleUserAction('visited')}
                    >
                      {pendingAction === 'visited' ? 'Zapisywanie…' : 'Byłem'}
                    </button>
                  )}

                  <button
                    className={`user-like-action${eventAction.saved ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={eventAction.saved}
                    disabled={pendingAction !== null}
                    onClick={() => void handleUserAction('saved')}
                  >
                    <span aria-hidden="true">{eventAction.saved ? '♥' : '♡'}</span>
                    {pendingAction === 'saved' ? 'Zapisywanie…' : eventAction.saved ? 'Polubione' : 'Polub'}
                  </button>
                </div>
              )}

              {user && userActionError && <p className="user-action-error" role="alert">{userActionError}</p>}
            </section>
          </>
        )}
      </div>
    </aside>
  )
}
