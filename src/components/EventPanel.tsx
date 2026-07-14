import { useEffect, useState } from 'react'
import type { Ref } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Heart,
  Navigation,
  Pencil,
  Ticket,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/authContext'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import {
  getEventAction,
  toggleEventAction,
} from '../services/userActionService'
import type { EventAction, EventActionKey } from '../services/userActionService'
import {
  formatEventDate,
  getEventStatus,
  getEventStatusLabel,
  isEventDateValid,
} from '../utils/eventStatus'
import {
  buildVenueDirectionsUrl,
  getVenueGoogleMapsUrl,
  hasValidVenueCoordinates,
} from '../utils/googleMaps'
import { getVenueDisplayName } from '../utils/venueDisplay'
import { EventForm } from './EventForm'

type EventPanelProps = {
  event: EventTimesEvent
  venue: Venue
  venues: Venue[]
  isAdminMode: boolean
  onBack: () => void
  onAddEvent: (event: EventTimesEvent) => void | Promise<void>
  onUpdateEvent: (event: EventTimesEvent) => void | Promise<void>
  onDeleteEvent: () => void
  onClose: () => void
  panelRef?: Ref<HTMLElement>
}

export function EventPanel({
  event,
  venue,
  venues,
  isAdminMode,
  onBack,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onClose,
  panelRef,
}: EventPanelProps) {
  const { user } = useAuth()
  const venueDisplayName = getVenueDisplayName(venue)
  const eventDescription = event.description?.trim() ?? ''
  const descriptionParagraphs = eventDescription
    .split(/\n{1,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  const isLongDescription =
    eventDescription.length > 650 || descriptionParagraphs.length > 3
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [isDuplicatingEvent, setIsDuplicatingEvent] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
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
  const hasValidEventDate = isEventDateValid(event)
  const eventStatus = getEventStatus(event)
  const shouldShowTicketAction = Boolean(event.ticketUrl && eventStatus !== 'past')

  useEffect(() => {
    setIsEditingEvent(false)
    setIsDuplicatingEvent(false)
    setIsDescriptionExpanded(false)
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
            setUserActionError(
              error instanceof Error
                ? error.message
                : 'Nie udało się pobrać akcji wydarzenia.',
            )
          }
        })
    }

    return () => {
      active = false
    }
  }, [event, user])

  async function saveEvent(updatedEvent: EventTimesEvent) {
    await onUpdateEvent(updatedEvent)
    setIsEditingEvent(false)
  }

  async function saveDuplicatedEvent(duplicatedEvent: EventTimesEvent) {
    await onAddEvent(duplicatedEvent)
    setIsDuplicatingEvent(false)
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
      setUserActionError(
        error instanceof Error ? error.message : 'Nie udało się zapisać akcji.',
      )
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <aside
      ref={panelRef}
      className="venue-panel event-panel"
      aria-label={`Szczegóły wydarzenia: ${event.name}`}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="venue-panel-handle" aria-hidden="true" />
      <button
        className="venue-panel-close"
        type="button"
        onClick={onClose}
        aria-label="Zamknij panel wydarzenia"
      >
        <X className="ui-icon" aria-hidden="true" />
      </button>
      {user && !isEditingEvent && !isDuplicatingEvent && (
        <button
          className={`event-like-floating${eventAction.saved ? ' is-active' : ''}`}
          type="button"
          aria-label={eventAction.saved ? 'Usuń z polubionych' : 'Polub wydarzenie'}
          aria-pressed={eventAction.saved}
          disabled={pendingAction !== null}
          onClick={() => void handleUserAction('saved')}
        >
          <Heart className="ui-icon" aria-hidden="true" />
        </button>
      )}

      <div className="venue-panel-content">
        {isEditingEvent || isDuplicatingEvent ? (
          <div className="context-edit-view">
            <header className="context-edit-header">
              <span>Tryb admina</span>
              <h1>{isDuplicatingEvent ? 'Duplikuj wydarzenie' : 'Edytuj wydarzenie'}</h1>
              {isDuplicatingEvent && (
                <p>Zmień datę, godzinę lub inne dane i zapisz jako nowe wydarzenie.</p>
              )}
            </header>
            <EventForm
              key={isDuplicatingEvent ? `duplicate-${event.id}` : event.id}
              venues={venues}
              initialEvent={event}
              isDuplicate={isDuplicatingEvent}
              onSave={isDuplicatingEvent ? saveDuplicatedEvent : saveEvent}
              onCancel={() => {
                setIsEditingEvent(false)
                setIsDuplicatingEvent(false)
              }}
            />
          </div>
        ) : (
          <>
            <button className="event-back-button" type="button" onClick={onBack}>
              <ArrowLeft className="ui-icon" aria-hidden="true" />
              Wróć do miejsca
            </button>

            <header className="event-panel-header event-pass-hero">
              <div className="event-pass-kicker">
                <span className="event-type-badge">{event.eventType}</span>
                <span className={`event-status-badge event-status-badge-${hasValidEventDate ? eventStatus : 'invalid'}`}>
                  {hasValidEventDate ? getEventStatusLabel(eventStatus) : 'Bez poprawnej daty'}
                </span>
              </div>
              <h1>{event.name}</h1>
              <div className="event-pass-meta">
                <time dateTime={event.startDate}>{formatEventDate(event.startDate, 'long')}</time>
                <span>{venueDisplayName}</span>
                <a
                  className="navigation-link"
                  href={
                    hasValidVenueCoordinates(venue)
                      ? buildVenueDirectionsUrl(venue)
                      : getVenueGoogleMapsUrl(venue)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="ui-icon" aria-hidden="true" />
                  Nawiguj w Google Maps
                  <ExternalLink className="ui-icon" aria-hidden="true" />
                </a>
              </div>
            </header>

            {isAdminMode && (
              <section className="inline-admin-actions" aria-label="Akcje administratora wydarzenia">
                <span>Tryb admina</span>
                <div>
                  <button type="button" onClick={() => setIsEditingEvent(true)}>
                    <Pencil className="ui-icon" aria-hidden="true" />
                    Edytuj event
                  </button>
                  <button type="button" onClick={() => setIsDuplicatingEvent(true)}>
                    <Copy className="ui-icon" aria-hidden="true" />
                    Duplikuj event
                  </button>
                  <button className="inline-admin-danger" type="button" onClick={onDeleteEvent}>
                    <Trash2 className="ui-icon" aria-hidden="true" />
                    Usuń event
                  </button>
                </div>
              </section>
            )}

            {user && (
              <section className="event-user-primary-actions" aria-label="Twoje akcje dla wydarzenia">
                {hasValidEventDate && eventStatus === 'upcoming' && (
                  <button
                    className={eventAction.going ? 'is-active' : ''}
                    type="button"
                    aria-pressed={eventAction.going}
                    disabled={pendingAction !== null}
                    onClick={() => void handleUserAction('going')}
                  >
                    <CalendarPlus className="ui-icon" aria-hidden="true" />
                    {pendingAction === 'going' ? 'Zapisywanie…' : 'Chcę iść'}
                  </button>
                )}

                {hasValidEventDate && eventStatus === 'past' && (
                  <button
                    className={eventAction.visited ? 'is-active' : ''}
                    type="button"
                    aria-pressed={eventAction.visited}
                    disabled={pendingAction !== null}
                    onClick={() => void handleUserAction('visited')}
                  >
                    <BadgeCheck className="ui-icon" aria-hidden="true" />
                    {pendingAction === 'visited' ? 'Zapisywanie…' : 'Byłem'}
                  </button>
                )}

                {userActionError && <p className="user-action-error" role="alert">{userActionError}</p>}
              </section>
            )}

            {shouldShowTicketAction && event.ticketUrl && (
              <section className="future-actions future-actions-priority" aria-labelledby="future-actions-title">
                <h2 id="future-actions-title">Bilety</h2>
                <a className="event-action event-action-primary" href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                  <Ticket className="ui-icon" aria-hidden="true" />
                  Kup bilet
                </a>
              </section>
            )}


            {eventDescription ? (
              <section className="event-description" aria-labelledby="event-description-title">
                <h2 id="event-description-title">O wydarzeniu</h2>
                <div
                  className={`event-description-text${
                    isLongDescription && !isDescriptionExpanded ? ' is-collapsed' : ''
                  }`}
                >
                  {descriptionParagraphs.length > 0 ? (
                    descriptionParagraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${paragraphIndex}-${paragraph.slice(0, 24)}`}>
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p>{eventDescription}</p>
                  )}
                </div>
                {isLongDescription && (
                  <button
                    className="event-description-toggle"
                    type="button"
                    aria-expanded={isDescriptionExpanded}
                    onClick={() =>
                      setIsDescriptionExpanded((currentValue) => !currentValue)
                    }
                  >
                    {isDescriptionExpanded ? (
                      <ChevronUp className="ui-icon" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="ui-icon" aria-hidden="true" />
                    )}
                    {isDescriptionExpanded ? 'Zwiń opis' : 'Czytaj więcej'}
                  </button>
                )}
              </section>
            ) : isAdminMode ? (
              <section className="event-description event-description-empty">
                <h2>O wydarzeniu</h2>
                <p>Brak opisu wydarzenia</p>
              </section>
            ) : null}

            {event.sourceUrl && (
              <a className="event-source-link" href={event.sourceUrl} target="_blank" rel="noreferrer">
                Zobacz źródło wydarzenia
                <ExternalLink className="ui-icon" aria-hidden="true" />
              </a>
            )}

          </>
        )}
      </div>
    </aside>
  )
}
