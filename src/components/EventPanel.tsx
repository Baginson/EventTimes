import { useEffect, useRef, useState } from 'react'
import type { MutableRefObject, Ref } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Heart,
  ImagePlus,
  Pencil,
  Share,
  Ticket,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/authContext'
import { MOBILE_PANEL_MEDIA_QUERY } from '../constants/breakpoints'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { usePanelMotion } from '../hooks/usePanelMotion'
import { usePanelSwipeToClose } from '../hooks/usePanelSwipeToClose'
import {
  getEventAction,
  toggleEventAction,
} from '../services/userActionService'
import type { EventAction, EventActionKey } from '../services/userActionService'
import {
  CLOUDINARY_UPLOADS_ENABLED,
  uploadImageToCloudinary,
} from '../services/cloudinaryService'
import {
  getEventMemory,
  MAX_MEMORY_PHOTOS,
  saveEventMemory,
} from '../services/memoryService'
import type { EventMemory, MemoryPhoto } from '../services/memoryService'
import {
  formatEventDate,
  getEventStatus,
  getEventStatusLabel,
  isEventDateValid,
} from '../utils/eventStatus'
import { hasValidVenueCoordinates } from '../utils/googleMaps'
import { buildShareUrl, shareUrl } from '../utils/shareLinks'
import { getVenueDisplayName } from '../utils/venueDisplay'
import { EventForm } from './EventForm'
import { NavigationButton } from './NavigationButton'
import { TravelTimeSection } from './TravelTimeSection'

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
  onShowVenue: () => void
  origin?: 'venue' | 'profile' | 'direct'
  onReturnToProfile?: () => void
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
  onShowVenue,
  origin = 'direct',
  onReturnToProfile,
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
    going: false,
    visited: false,
    saved: false,
  })
  const [pendingAction, setPendingAction] = useState<EventActionKey | null>(null)
  const [eventHeartAnimationId, setEventHeartAnimationId] = useState(0)
  const [userActionError, setUserActionError] = useState('')
  const [memoryNote, setMemoryNote] = useState('')
  const [memoryPhotos, setMemoryPhotos] = useState<MemoryPhoto[]>([])
  const [savedMemory, setSavedMemory] = useState<EventMemory | null>(null)
  const [isMemoryEditing, setIsMemoryEditing] = useState(false)
  const [memoryError, setMemoryError] = useState('')
  const [memoryFeedback, setMemoryFeedback] = useState('')
  const [isMemoryLoading, setIsMemoryLoading] = useState(false)
  const [isMemorySaving, setIsMemorySaving] = useState(false)
  const [isMemoryUploading, setIsMemoryUploading] = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')
  const hasValidEventDate = isEventDateValid(event)
  const eventStatus = getEventStatus(event)
  const shouldShowTicketAction = Boolean(event.ticketUrl && eventStatus !== 'past')
  const shouldShowEventMemory = Boolean(
    user && hasValidEventDate && eventStatus === 'past' && eventAction.visited,
  )
  const panelMotion = usePanelMotion()
  const shouldReduceMotion = useReducedMotion()
  const isMobilePanel = useMediaQuery(MOBILE_PANEL_MEDIA_QUERY)
  const { contentRef, dragControls, handleProps, drag, dragListener, dragConstraints, dragElastic, dragMomentum, dragTransition, onDragEnd } =
    usePanelSwipeToClose({
      onClose,
      enabled: isMobilePanel && !shouldReduceMotion,
    })
  const panelElementRef = useRef<HTMLElement | null>(null)
  const memoryFileInputRef = useRef<HTMLInputElement | null>(null)
  const shareFeedbackTimeoutRef = useRef<number | null>(null)
  const memoryFeedbackTimeoutRef = useRef<number | null>(null)

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
    setIsEditingEvent(false)
    setIsDuplicatingEvent(false)
    setIsDescriptionExpanded(false)
    setEventHeartAnimationId(0)
    setShareFeedback('')
    setMemoryNote('')
    setMemoryPhotos([])
    setMemoryError('')
    setMemoryFeedback('')
  }, [event.id])

  useEffect(() => {
    panelElementRef.current?.focus({ preventScroll: true })
  }, [event.id])

  useEffect(() => {
    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === 'Escape') {
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

      if (memoryFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(memoryFeedbackTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let active = true
    const emptyAction: EventAction = {
      eventId: event.id,
      venueId: event.venueId,
      going: false,
      visited: false,
      saved: false,
    }
    setEventAction(emptyAction)
    setEventHeartAnimationId(0)
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

  useEffect(() => {
    let active = true

    setMemoryError('')
    setMemoryFeedback('')

    if (!user || !shouldShowEventMemory) {
      setMemoryNote('')
      setMemoryPhotos([])
      setSavedMemory(null)
      setIsMemoryEditing(false)
      setIsMemoryLoading(false)
      return () => {
        active = false
      }
    }

    setIsMemoryLoading(true)

    void getEventMemory(user.uid, event.id)
      .then((memory) => {
        if (!active) {
          return
        }

        setMemoryNote(memory?.note ?? '')
        setMemoryPhotos(memory?.photos ?? [])
        setSavedMemory(memory ?? null)
        setIsMemoryEditing(!memory)
      })
      .catch((error: unknown) => {
        if (active) {
          setMemoryError(
            error instanceof Error
              ? error.message
              : 'Nie udało się pobrać wspomnienia.',
          )
        }
      })
      .finally(() => {
        if (active) {
          setIsMemoryLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [event.id, shouldShowEventMemory, user])

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

      if (key === 'saved') {
        setEventHeartAnimationId((animationId) => animationId + 1)
      }
    } catch (error) {
      setUserActionError(
        error instanceof Error ? error.message : 'Nie udało się zapisać akcji.',
      )
    } finally {
      setPendingAction(null)
    }
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

  function showMemoryFeedback(message: string) {
    setMemoryFeedback(message)

    if (memoryFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(memoryFeedbackTimeoutRef.current)
    }

    memoryFeedbackTimeoutRef.current = window.setTimeout(() => {
      setMemoryFeedback('')
      memoryFeedbackTimeoutRef.current = null
    }, 2500)
  }

  async function handleMemoryPhotoUpload(file: File) {
    setMemoryError('')

    if (memoryPhotos.length >= MAX_MEMORY_PHOTOS) {
      setMemoryError('Możesz dodać maksymalnie 6 zdjęć.')
      return
    }

    try {
      setIsMemoryUploading(true)
      const { url, publicId } = await uploadImageToCloudinary(file)
      setMemoryPhotos((currentPhotos) => {
        if (currentPhotos.length >= MAX_MEMORY_PHOTOS) {
          return currentPhotos
        }

        return [
          ...currentPhotos,
          {
            id: crypto.randomUUID(),
            url,
            publicId,
            createdAt: new Date().toISOString(),
          },
        ]
      })
    } catch (error) {
      setMemoryError(
        error instanceof Error ? error.message : 'Nie udało się dodać zdjęcia.',
      )
    } finally {
      setIsMemoryUploading(false)
      if (memoryFileInputRef.current) {
        memoryFileInputRef.current.value = ''
      }
    }
  }

  async function handleSaveMemory() {
    if (!user) {
      return
    }

    const memory: Omit<EventMemory, 'createdAt' | 'updatedAt'> = {
      eventId: event.id,
      venueId: event.venueId,
      note: memoryNote,
      photos: memoryPhotos,
    }

    setMemoryError('')

    try {
      setIsMemorySaving(true)
      await saveEventMemory(user.uid, memory)
      setSavedMemory({ ...memory })
      setIsMemoryEditing(false)
      showMemoryFeedback('Zapisano')
    } catch (error) {
      setMemoryError(
        error instanceof Error ? error.message : 'Nie udało się zapisać wspomnienia.',
      )
    } finally {
      setIsMemorySaving(false)
    }
  }

  async function handleShareEvent() {
    const url = buildShareUrl({ eventId: event.id })

    try {
      const result = await shareUrl(url, event.name)

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

  return (
    <motion.aside
      ref={setPanelElement}
      className="venue-panel event-panel"
      role="dialog"
      aria-label={`Szczegóły wydarzenia: ${event.name}`}
      tabIndex={-1}
      {...panelMotion}
      drag={drag}
      dragListener={dragListener}
      dragControls={dragControls}
      dragConstraints={dragConstraints}
      dragElastic={dragElastic}
      dragMomentum={dragMomentum}
      dragTransition={dragTransition}
      onDragEnd={onDragEnd}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="venue-panel-handle" aria-hidden="true" {...handleProps} />
      <div className="venue-panel-controls" aria-label="Akcje panelu wydarzenia">
        {user && !isEditingEvent && !isDuplicatingEvent && (
          <button
            className={`venue-panel-icon-action event-like-floating like-heart-button${
              eventAction.saved ? ' is-active is-liked' : ''
            }${
              eventHeartAnimationId > 0 ? ' is-animating' : ''
            }`}
            type="button"
            aria-label={
              eventAction.saved ? 'Usuń wydarzenie z polubionych' : 'Polub wydarzenie'
            }
            aria-pressed={eventAction.saved}
            disabled={pendingAction !== null}
            onClick={() => void handleUserAction('saved')}
          >
            <Heart
              key={`event-heart-${eventHeartAnimationId}`}
              className={`ui-icon like-heart-icon${eventAction.saved ? ' is-liked' : ''}`}
              aria-hidden="true"
            />
          </button>
        )}
        <button
          className="venue-panel-icon-action"
          type="button"
          onClick={() => void handleShareEvent()}
          aria-label="Udostępnij wydarzenie"
        >
          <Share className="ui-icon" aria-hidden="true" />
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
          aria-label="Zamknij panel wydarzenia"
        >
          <X className="ui-icon" aria-hidden="true" />
        </button>
      </div>

      <div ref={contentRef} className="venue-panel-content">
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
            <div className="event-back-row">
              {origin === 'profile' && onReturnToProfile ? (
                <button
                  className="event-back-button"
                  type="button"
                  onClick={onReturnToProfile}
                >
                  <ArrowLeft className="ui-icon" aria-hidden="true" />
                  Wróć do profilu
                </button>
              ) : (
                <button className="event-back-button" type="button" onClick={onBack}>
                  <ArrowLeft className="ui-icon" aria-hidden="true" />
                  {origin === 'venue' ? 'Wróć do miejsca' : 'Pokaż miejsce'}
                </button>
              )}
            </div>

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
                <div className="event-pass-venue-row">
                  <button
                    className="event-venue-link"
                    type="button"
                    onClick={onShowVenue}
                    aria-label={`Pokaż miejsce na mapie: ${venueDisplayName}`}
                    title="Pokaż miejsce na mapie"
                  >
                    {venueDisplayName}
                  </button>
                  <NavigationButton venue={venue} />
                </div>
              </div>
            </header>

            <TravelTimeSection
              destination={hasValidVenueCoordinates(venue) ? venue.coordinates : null}
            />

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

            {shouldShowEventMemory && (
              <section className="event-memory" aria-labelledby="event-memory-title">
                <div className="event-memory-header">
                  <h2 id="event-memory-title">
                    Moje wspomnienie <span>(prywatne)</span>
                  </h2>
                  {isMemoryLoading && <span role="status">Ładowanie...</span>}
                  {!isMemoryLoading && savedMemory && !isMemoryEditing && (
                    <button
                      className="event-memory-secondary-action"
                      type="button"
                      onClick={() => setIsMemoryEditing(true)}
                    >
                      <Pencil className="ui-icon" aria-hidden="true" />
                      Edytuj
                    </button>
                  )}
                </div>

                {!isMemoryLoading && !isMemoryEditing && savedMemory ? (
                  <div className="event-memory-view">
                    {savedMemory.note.trim() ? (
                      <p className="event-memory-note">{savedMemory.note}</p>
                    ) : (
                      <p className="event-memory-note event-memory-note-empty">
                        Brak notatki — samo wspomnienie w zdjęciach.
                      </p>
                    )}
                    {savedMemory.photos.length > 0 && (
                      <div className="event-memory-photo-grid" aria-label="Zdjęcia wspomnienia">
                        {savedMemory.photos.map((photo) => (
                          <div className="event-memory-photo" key={photo.id}>
                            <img src={photo.url} alt="" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <label className="event-memory-field" htmlFor={`event-memory-note-${event.id}`}>
                      <span>Prywatna notatka</span>
                      <textarea
                        id={`event-memory-note-${event.id}`}
                        value={memoryNote}
                        placeholder="Jak było? Zapisz dla siebie..."
                        maxLength={2000}
                        disabled={isMemoryLoading || isMemorySaving}
                        onChange={(changeEvent) => setMemoryNote(changeEvent.target.value)}
                      />
                    </label>

                    {memoryPhotos.length > 0 && (
                      <div className="event-memory-photo-grid" aria-label="Zdjęcia wspomnienia">
                        {memoryPhotos.map((photo) => (
                          <div className="event-memory-photo" key={photo.id}>
                            <img src={photo.url} alt="" />
                            <button
                              type="button"
                              aria-label="Usuń zdjęcie"
                              disabled={isMemorySaving}
                              onClick={() =>
                                setMemoryPhotos((currentPhotos) =>
                                  currentPhotos.filter((item) => item.id !== photo.id),
                                )
                              }
                            >
                              <X className="ui-icon" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="event-memory-actions">
                      {CLOUDINARY_UPLOADS_ENABLED && memoryPhotos.length < MAX_MEMORY_PHOTOS && (
                        <>
                          <input
                            ref={memoryFileInputRef}
                            className="event-memory-file-input"
                            type="file"
                            accept="image/*"
                            aria-label="Dodaj zdjęcie do wspomnienia"
                            disabled={isMemoryUploading || isMemorySaving}
                            onChange={(changeEvent) => {
                              const file = changeEvent.target.files?.[0]

                              if (file) {
                                void handleMemoryPhotoUpload(file)
                              }
                            }}
                          />
                          <button
                            className="event-memory-secondary-action"
                            type="button"
                            disabled={isMemoryUploading || isMemorySaving}
                            onClick={() => memoryFileInputRef.current?.click()}
                          >
                            <ImagePlus className="ui-icon" aria-hidden="true" />
                            {isMemoryUploading ? 'Dodawanie...' : 'Dodaj zdjęcie'}
                          </button>
                        </>
                      )}

                      <button
                        className="event-memory-primary-action"
                        type="button"
                        disabled={isMemoryLoading || isMemorySaving || isMemoryUploading}
                        onClick={() => void handleSaveMemory()}
                      >
                        {isMemorySaving ? 'Zapisywanie...' : 'Zapisz wspomnienie'}
                      </button>

                      {savedMemory && (
                        <button
                          className="event-memory-secondary-action"
                          type="button"
                          disabled={isMemorySaving || isMemoryUploading}
                          onClick={() => {
                            setMemoryNote(savedMemory.note)
                            setMemoryPhotos(savedMemory.photos)
                            setMemoryError('')
                            setIsMemoryEditing(false)
                          }}
                        >
                          Anuluj
                        </button>
                      )}
                    </div>
                  </>
                )}

                {memoryFeedback && (
                  <p className="event-memory-feedback" role="status">
                    {memoryFeedback}
                  </p>
                )}
                {memoryError && (
                  <p className="event-memory-error" role="alert">
                    {memoryError}
                  </p>
                )}
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

            {shouldShowTicketAction && event.ticketUrl && (
              <section className="future-actions future-actions-priority event-panel-footer-cta" aria-labelledby="future-actions-title">
                <h2 id="future-actions-title">Bilety</h2>
                <a className="event-action event-action-primary" href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                  <Ticket className="ui-icon" aria-hidden="true" />
                  Kup bilet
                </a>
              </section>
            )}

          </>
        )}
      </div>
    </motion.aside>
  )
}
