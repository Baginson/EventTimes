import { useEffect, useRef, useState } from 'react'
import type { MutableRefObject, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Heart,
  MapPinPlus,
  Navigation,
  Pencil,
  Plus,
  Share2,
  Ticket,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/authContext'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { usePanelMotion } from '../hooks/usePanelMotion'
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
import { buildShareUrl, shareUrl } from '../utils/shareLinks'
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
  const venueDescription = venue.description.trim()
  const isLongDescription = venueDescription.length > 450
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isVenueSaved, setIsVenueSaved] = useState(false)
  const [venueHeartAnimationId, setVenueHeartAnimationId] = useState(0)
  const [userActionError, setUserActionError] = useState('')
  const [shareFeedback, setShareFeedback] = useState('')
  const panelMotion = usePanelMotion()
  const shouldReduceMotion = useReducedMotion()
  const panelElementRef = useRef<HTMLElement | null>(null)
  const shareFeedbackTimeoutRef = useRef<number | null>(null)

  function setPanelElement(node: HTMLElement | null) {
    panelElementRef.current = node

    if (typeof panelRef === 'function') {
      panelRef(node)
      return
    }

    if (panelRef) {
      ;(panelRef as MutableRefObject<HTMLElement | null>).current = node
    }
  }

  useEffect(() => {
    setIsEditingVenue(false)
    setIsAddingEvent(false)
    setDuplicatedEvent(null)
    setIsDescriptionExpanded(false)
    setShareFeedback('')
    setExpandedEventSections({
      ongoing: true,
      upcoming: true,
      past: false,
    })
  }, [venue.id])

  useEffect(() => {
    panelElementRef.current?.focus({ preventScroll: true })
  }, [venue.id])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    return () => {
      if (shareFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(shareFeedbackTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let active = true
    setIsVenueSaved(false)
    setVenueHeartAnimationId(0)
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
      setVenueHeartAnimationId((animationId) => animationId + 1)
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
    const shouldShowTicketLink =
      Boolean(event.ticketUrl) && variant !== 'past' && variant !== 'invalid'
    const formattedDate = formatEventDate(event.startDate)

    return (
      <li className={`event-card event-card-${variant}`} key={event.id}>
        <button
          className="event-card-main"
          type="button"
          onClick={() => onEventSelect(event)}
        >
          <span className="event-agenda-date" aria-hidden="true">
            <span>{formattedDate}</span>
          </span>
          <span className="event-card-copy">
            <span className="event-meta">
              <span>{event.eventType}</span>
              <time dateTime={event.startDate}>{formattedDate}</time>
            </span>
            <strong>{event.name}</strong>
            {variant === 'invalid' && (
              <span className="event-status-pill event-status-invalid">BRAK DATY</span>
            )}
            {event.description?.trim() && (
              <span className="event-card-description">{event.description.trim()}</span>
            )}
            <span className="event-details-link">Zobacz szczegóły</span>
          </span>
        </button>
        {shouldShowTicketLink && event.ticketUrl && (
          <a href={event.ticketUrl} target="_blank" rel="noreferrer">
            <Ticket className="ui-icon" aria-hidden="true" />
            Kup bilet
          </a>
        )}
        {isAdminMode && (
          <button
            className="event-card-admin-action"
            type="button"
            onClick={() => startDuplicatingEvent(event)}
          >
            <Copy className="ui-icon" aria-hidden="true" />
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
            <ChevronDown className="ui-icon event-status-chevron" aria-hidden="true" />
          </button>
        ) : (
          <div className="event-status-heading">
            <h3>{title}</h3>
            <span>{sectionEvents.length}</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {isExpanded && (
          <motion.ul
            className="event-list"
            style={{ overflow: 'hidden' }}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] as const }}
          >
            {sectionEvents.map((event) => renderEventCard(event, variant))}
          </motion.ul>
          )}
        </AnimatePresence>
      </section>
    )
  }

  function showShareFeedback(message: string) {
    setShareFeedback(message)

    if (shareFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(shareFeedbackTimeoutRef.current)
    }

    shareFeedbackTimeoutRef.current = window.setTimeout(() => {
      setShareFeedback('')
      shareFeedbackTimeoutRef.current = null
    }, 2500)
  }

  async function handleShareVenue() {
    const url = buildShareUrl({ venueId: venue.id })

    try {
      const result = await shareUrl(url, venueDisplayName)

      if (result === 'copied') {
        showShareFeedback('Skopiowano link')
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'share-cancelled') {
        return
      }

      showShareFeedback('Nie udało się udostępnić.')
    }
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
    <motion.aside
      ref={setPanelElement}
      className="venue-panel"
      role="dialog"
      aria-label={`Informacje o miejscu: ${venueDisplayName}`}
      tabIndex={-1}
      {...panelMotion}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="venue-panel-handle" aria-hidden="true" />
      <div className="venue-panel-controls" aria-label="Akcje panelu miejsca">
        {user && !isEditingVenue && (
          <button
            className={`venue-panel-icon-action venue-panel-like like-heart-button${
              isVenueSaved ? ' is-active is-liked' : ''
            }${
              venueHeartAnimationId > 0 ? ' is-animating' : ''
            }`}
            type="button"
            aria-label={isVenueSaved ? 'Usuń miejsce z polubionych' : 'Polub miejsce'}
            aria-pressed={isVenueSaved}
            onClick={() => void handleVenueSave()}
          >
            <Heart
              key={`venue-heart-${venueHeartAnimationId}`}
              className={`ui-icon like-heart-icon${isVenueSaved ? ' is-liked' : ''}`}
              aria-hidden="true"
            />
          </button>
        )}
        <button
          className="venue-panel-icon-action"
          type="button"
          onClick={() => void handleShareVenue()}
          aria-label="Udostępnij miejsce"
        >
          <Share2 className="ui-icon" aria-hidden="true" />
        </button>
        {shareFeedback && (
          <span className="share-feedback" role="status">
            {shareFeedback}
          </span>
        )}
        <button
          className="venue-panel-close"
          type="button"
          onClick={onClose}
          aria-label="Zamknij panel miejsca"
        >
          <X className="ui-icon" aria-hidden="true" />
        </button>
      </div>

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
            <header className="venue-editorial-header">
              <span className="venue-type">{venue.venueType}</span>
              <h1>{venueDisplayName}</h1>
              <p>Przystanek na mapie wydarzeń</p>
            </header>
            <section className="venue-location-module" aria-label="Adres i nawigacja">
              <div>
                <span>Adres</span>
                <p className="venue-address">{venueAddress}</p>
              </div>
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
            </section>
            {userActionError && <p className="user-action-error" role="alert">{userActionError}</p>}
            {venueDescription ? (
              <section className="venue-story">
                <span>O miejscu</span>
                <p
                  className={`venue-description${
                    isLongDescription && !isDescriptionExpanded ? ' is-collapsed' : ''
                  }`}
                >
                  {venueDescription}
                </p>
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
              <p className="venue-description venue-description-empty">Brak opisu miejsca</p>
            ) : null}

            {isAdminMode && (
              <section className="inline-admin-actions" aria-label="Akcje administratora miejsca">
                <span>Tryb admina</span>
                <div>
                  <button type="button" onClick={() => setIsEditingVenue(true)}>
                    <Pencil className="ui-icon" aria-hidden="true" />
                    Edytuj miejsce
                  </button>
                  <button type="button" onClick={startAddingEvent}>
                    <Plus className="ui-icon" aria-hidden="true" />
                    Dodaj wydarzenie
                  </button>
                  <button type="button" onClick={onMoveVenue} disabled={isPinMoveActive}>
                    <MapPinPlus className="ui-icon" aria-hidden="true" />
                    {isPinMoveActive ? 'Przesuwanie…' : 'Przesuń pinezkę'}
                  </button>
                  <button className="inline-admin-danger" type="button" onClick={onDeleteVenue}>
                    <Trash2 className="ui-icon" aria-hidden="true" />
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
    </motion.aside>
  )
}
