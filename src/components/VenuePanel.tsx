import { useEffect, useState } from 'react'
import type { Ref } from 'react'
import { useAuth } from '../auth/authContext'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { getVenueAction, toggleVenueSaved } from '../services/userActionService'
import {
  formatEventDate,
  getEventStartTime,
  getEventStatus,
  isEventDateValid,
} from '../utils/eventStatus'
import {
  buildVenueDirectionsUrl,
  getVenueGoogleMapsUrl,
  hasValidVenueCoordinates,
} from '../utils/googleMaps'
import { formatVenueAddress, getVenueDisplayName } from '../utils/venueDisplay'
import { EventForm } from './EventForm'
import { VenueForm } from './VenueForm'

type EventSectionVariant = 'ongoing' | 'upcoming' | 'past' | 'invalid'
type CollapsibleEventSectionVariant = Exclude<EventSectionVariant, 'invalid'>
const brandMarkUrl = `${import.meta.env.BASE_URL}brand/event-times-mark.png`

type VenuePanelProps = {
  venue: Venue
  events: EventTimesEvent[]
  isAdminMode: boolean
  isPinMoveActive: boolean
  onEventSelect: (event: EventTimesEvent) => void
  venues: Venue[]
  onAddEvent: (event: EventTimesEvent) => void | Promise<void>
  onUpdateVenue: (venue: Venue) => void | Promise<void>
  onDeleteVenue: () => void
  onMoveVenue: () => void
  onClose: () => void
  panelRef?: Ref<HTMLElement>
}

function sortByStartAscending(firstEvent: EventTimesEvent, secondEvent: EventTimesEvent) {
  return getEventStartTime(firstEvent) - getEventStartTime(secondEvent)
}

function sortByStartDescending(firstEvent: EventTimesEvent, secondEvent: EventTimesEvent) {
  return getEventStartTime(secondEvent) - getEventStartTime(firstEvent)
}

export function VenuePanel({
  venue,
  events,
  isAdminMode,
  isPinMoveActive,
  onEventSelect,
  venues,
  onAddEvent,
  onUpdateVenue,
  onDeleteVenue,
  onMoveVenue,
  onClose,
  panelRef,
}: VenuePanelProps) {
  const { user } = useAuth()
  const venueDisplayName = getVenueDisplayName(venue)
  const venueAddress = formatVenueAddress(venue)
  const groupedEvents = {
    ongoing: events
      .filter((event) => isEventDateValid(event) && getEventStatus(event) === 'ongoing')
      .sort(sortByStartAscending),
    upcoming: events
      .filter((event) => isEventDateValid(event) && getEventStatus(event) === 'upcoming')
      .sort(sortByStartAscending),
    past: events
      .filter((event) => isEventDateValid(event) && getEventStatus(event) === 'past')
      .sort(sortByStartDescending),
    invalid: events.filter((event) => !isEventDateValid(event)),
  }
  const [isEditingVenue, setIsEditingVenue] = useState(false)
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [duplicatedEvent, setDuplicatedEvent] = useState<EventTimesEvent | null>(null)
  const [expandedEventSections, setExpandedEventSections] = useState<
    Record<CollapsibleEventSectionVariant, boolean>
  >({
    ongoing: true,
    upcoming: true,
    past: false,
  })
  const [isVenueSaved, setIsVenueSaved] = useState(false)
  const [userActionError, setUserActionError] = useState('')

  useEffect(() => {
    setIsEditingVenue(false)
    setIsAddingEvent(false)
    setDuplicatedEvent(null)
    setExpandedEventSections({
      ongoing: true,
      upcoming: true,
      past: false,
    })
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
            setUserActionError(
              error instanceof Error
                ? error.message
                : 'Nie udało się pobrać zapisu miejsca.',
            )
          }
        })
    }

    return () => {
      active = false
    }
  }, [user, venue.id])

  async function saveVenue(updatedVenue: Venue) {
    await onUpdateVenue(updatedVenue)
    setIsEditingVenue(false)
  }

  async function saveEvent(event: EventTimesEvent) {
    await onAddEvent(event)
    setIsAddingEvent(false)
    setDuplicatedEvent(null)
  }

  function startAddingEvent() {
    setDuplicatedEvent(null)
    setIsAddingEvent(true)
  }

  function startDuplicatingEvent(event: EventTimesEvent) {
    setIsAddingEvent(false)
    setDuplicatedEvent(event)
  }

  function toggleEventSection(variant: CollapsibleEventSectionVariant) {
    setExpandedEventSections((current) => ({
      ...current,
      [variant]: !current[variant],
    }))
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
      setUserActionError(
        error instanceof Error ? error.message : 'Nie udało się zapisać miejsca.',
      )
    }
  }

  function renderEventCard(
    event: EventTimesEvent,
    variant: EventSectionVariant,
  ) {
    return (
      <li className={`event-card event-card-${variant}`} key={event.id}>
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
            {variant === 'invalid' && (
              <span className="event-status-pill event-status-invalid">BRAK DATY</span>
            )}
            <time dateTime={event.startDate}>{formatEventDate(event.startDate)}</time>
          </span>
          <strong>{event.name}</strong>
          {event.description?.trim() && (
            <span className="event-card-description">{event.description.trim()}</span>
          )}
          <span className="event-details-link">Zobacz szczegóły →</span>
        </button>
        {event.ticketUrl && (
          <a href={event.ticketUrl} target="_blank" rel="noreferrer">
            Kup bilet
          </a>
        )}
        {isAdminMode && (
          <button
            className="event-card-admin-action"
            type="button"
            onClick={() => startDuplicatingEvent(event)}
          >
            Duplikuj event
          </button>
        )}
      </li>
    )
  }

  function renderEventSection(
    title: string,
    sectionEvents: EventTimesEvent[],
    variant: EventSectionVariant,
    isCollapsible = false,
  ) {
    if (!sectionEvents.length) {
      return null
    }

    const isCollapsibleVariant = variant !== 'invalid'
    const isExpanded =
      !isCollapsible || !isCollapsibleVariant || expandedEventSections[variant]

    return (
      <section
        key={variant}
        className={`event-status-section event-status-section-${variant}`}
      >
        {isCollapsible && isCollapsibleVariant ? (
          <button
            className="event-status-heading event-status-toggle"
            type="button"
            aria-expanded={isExpanded}
            onClick={() => toggleEventSection(variant)}
          >
            <span className="event-status-title">{title}</span>
            <span className="event-status-count">{sectionEvents.length}</span>
            <span className="event-status-chevron" aria-hidden="true">
              {isExpanded ? '⌃' : '⌄'}
            </span>
          </button>
        ) : (
          <div className="event-status-heading">
            <h3>{title}</h3>
            <span>{sectionEvents.length}</span>
          </div>
        )}

        {isExpanded && (
          <ul className="event-list">
            {sectionEvents.map((event) => renderEventCard(event, variant))}
          </ul>
        )}
      </section>
    )
  }

  const statusEventSections = [
    {
      title: 'Trwa teraz',
      events: groupedEvents.ongoing,
      variant: 'ongoing' as const,
    },
    {
      title: 'Nadchodzące',
      events: groupedEvents.upcoming,
      variant: 'upcoming' as const,
    },
    {
      title: 'Minione',
      events: groupedEvents.past,
      variant: 'past' as const,
    },
  ].filter((section) => section.events.length > 0)
  const shouldCollapseEventSections = statusEventSections.length > 1
  const singleStatusEventSection = statusEventSections[0]

  return (
    <aside
      ref={panelRef}
      className="venue-panel"
      aria-label={`Informacje o miejscu: ${venueDisplayName}`}
      onPointerDown={(event) => event.stopPropagation()}
    >
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
            <h1>{venueDisplayName}</h1>
            <p className="venue-address">{venueAddress}</p>
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
                  <span aria-hidden="true">{isVenueSaved ? '♡' : '♡'}</span>
                  {isVenueSaved ? 'Polubione' : 'Polub'}
                </button>
                {userActionError && <p className="user-action-error" role="alert">{userActionError}</p>}
              </>
            )}
            {venue.description.trim() ? (
              <p className="venue-description">{venue.description}</p>
            ) : isAdminMode ? (
              <p className="venue-description venue-description-empty">Brak opisu miejsca</p>
            ) : null}

            {isAdminMode && (
              <section className="inline-admin-actions" aria-label="Akcje administratora miejsca">
                <span>Tryb admina</span>
                <div>
                  <button type="button" onClick={() => setIsEditingVenue(true)}>
                    Edytuj miejsce
                  </button>
                  <button type="button" onClick={startAddingEvent}>
                    Dodaj wydarzenie
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

            {isAdminMode && (isAddingEvent || duplicatedEvent) && (
              <section className="context-edit-view context-add-event" aria-label="Dodaj wydarzenie do miejsca">
                <header className="context-edit-header">
                  <span>Tryb admina</span>
                  <h1>{duplicatedEvent ? 'Duplikuj wydarzenie' : 'Dodaj wydarzenie'}</h1>
                  <p>
                    {duplicatedEvent
                      ? 'Zmień datę, godzinę lub inne dane i zapisz jako nowe wydarzenie.'
                      : `Wydarzenie zostanie automatycznie przypisane do: ${venueDisplayName}`}
                  </p>
                </header>
                <EventForm
                  key={duplicatedEvent ? `duplicate-${duplicatedEvent.id}` : `new-event-${venue.id}`}
                  venues={venues}
                  initialEvent={duplicatedEvent ?? undefined}
                  lockedVenueId={venue.id}
                  isDuplicate={Boolean(duplicatedEvent)}
                  onSave={saveEvent}
                  onCancel={() => {
                    setIsAddingEvent(false)
                    setDuplicatedEvent(null)
                  }}
                />
              </section>
            )}

            <section className="events-section">
              <div className="events-heading">
                <h2>Wydarzenia</h2>
                <span>{events.length}</span>
              </div>

              {events.length > 0 ? (
                <div className="event-status-groups">
                  {shouldCollapseEventSections ? (
                    statusEventSections.map((section) =>
                      renderEventSection(
                        section.title,
                        section.events,
                        section.variant,
                        true,
                      ),
                    )
                  ) : singleStatusEventSection ? (
                    <ul className="event-list">
                      {singleStatusEventSection.events.map((event) =>
                        renderEventCard(event, singleStatusEventSection.variant),
                      )}
                    </ul>
                  ) : null}
                  {renderEventSection('Bez poprawnej daty', groupedEvents.invalid, 'invalid')}
                </div>
              ) : (
                <div className="empty-state empty-events">
                  <img
                    className="empty-state-brand-mark"
                    src={brandMarkUrl}
                    alt="Event Times"
                  />
                  <strong>Brak wydarzeń</strong>
                  <p>Brak wydarzeń dla tego miejsca.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </aside>
  )
}
