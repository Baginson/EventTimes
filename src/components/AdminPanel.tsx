import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  MapPinPlus,
  Move,
  Pencil,
  RefreshCw,
  ShieldOff,
  Trash2,
  X,
} from 'lucide-react'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { MOBILE_PANEL_MEDIA_QUERY } from '../constants/breakpoints'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { usePanelSwipeToClose } from '../hooks/usePanelSwipeToClose'
import type { LocalBackupData } from '../services/localBackupService'
import { getDistanceMeters } from '../utils/geo'
import { normalizeForMatch } from '../utils/textNormalize'
import { formatVenueAddress, getVenueDisplayName } from '../utils/venueDisplay'
import { AdminDataSection } from './AdminDataSection'
import { AdminEventsSection } from './AdminEventsSection'
import { VenueForm } from './VenueForm'
import type { VenueFormDraft } from './VenueForm'

type AdminPanelProps = {
  venues: Venue[]
  events: EventTimesEvent[]
  movingVenueId: string | null
  isAddingVenue: boolean
  draftVenueCoordinates: Venue['coordinates'] | null
  onAddVenue: (venue: Venue) => void | Promise<void>
  onUpdateVenue: (venue: Venue) => void | Promise<void>
  onDeleteVenue: (venueId: string) => boolean | Promise<boolean>
  onAddEvent: (event: EventTimesEvent) => void | Promise<void>
  onUpdateEvent: (event: EventTimesEvent) => void | Promise<void>
  onDeleteEvent: (eventId: string) => boolean | Promise<boolean>
  onImportData: (backup: LocalBackupData) => void
  onImportFirestoreData: (backup: LocalBackupData) => Promise<void>
  onMoveCurrentDataToFirestore: () => Promise<void>
  onRefreshData: () => Promise<void>
  onResetData: () => void
  onClearData: () => void
  onStartVenueAdd: () => void
  onSetDraftVenueCoordinates: (coordinates: Venue['coordinates']) => void
  onAdjustTemporaryPin: () => void
  onStartPinMove: (venueId: string) => void
  onCancelMapMode: () => void
  onDisableAdminMode: () => void
  onClose: () => void
}

export function AdminPanel({
  venues,
  events,
  movingVenueId,
  isAddingVenue,
  draftVenueCoordinates,
  onAddVenue,
  onUpdateVenue,
  onDeleteVenue,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onImportData,
  onImportFirestoreData,
  onMoveCurrentDataToFirestore,
  onRefreshData,
  onResetData,
  onClearData,
  onStartVenueAdd,
  onSetDraftVenueCoordinates,
  onAdjustTemporaryPin,
  onStartPinMove,
  onCancelMapMode,
  onDisableAdminMode,
  onClose,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'venues' | 'events' | 'data'>('venues')
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [pendingVenueAction, setPendingVenueAction] = useState<string | null>(null)
  const [isRefreshingData, setIsRefreshingData] = useState(false)
  const [prefilledVenueDraft, setPrefilledVenueDraft] = useState<VenueFormDraft | null>(null)
  const [prefilledVenueDraftKey, setPrefilledVenueDraftKey] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  const isMobilePanel = useMediaQuery(MOBILE_PANEL_MEDIA_QUERY)
  const { contentRef, drag, dragConstraints, dragElastic, dragMomentum, onDragEnd } =
    usePanelSwipeToClose({
      onClose,
      enabled: isMobilePanel && !shouldReduceMotion,
    })
  const editingVenue = venues.find((venue) => venue.id === editingVenueId)
  const isAddingVenueDraft = isAddingVenue && draftVenueCoordinates !== null
  const isTicketmasterVenueDraft = prefilledVenueDraft !== null && !editingVenueId

  function startEditing(venue: Venue) {
    onCancelMapMode()
    setPrefilledVenueDraft(null)
    setEditingVenueId(venue.id)
    setSuccessMessage('')
  }

  function cancelEditing() {
    setEditingVenueId(null)
    setSuccessMessage('')
  }

  function startPinMove(venueId: string) {
    cancelEditing()
    onStartPinMove(venueId)
  }

  function startVenueAdd() {
    cancelEditing()
    setPrefilledVenueDraft(null)
    setActiveTab('venues')
    setSuccessMessage('')
    onStartVenueAdd()
  }

  function openCreateVenueForm(prefillVenueData: VenueFormDraft) {
    onCancelMapMode()
    setEditingVenueId(null)
    setPrefilledVenueDraft(prefillVenueData)
    setPrefilledVenueDraftKey((current) => current + 1)
    setActiveTab('venues')
    setSuccessMessage('Uzupełniono formularz danymi z Ticketmaster. Sprawdź dane przed zapisem.')
  }

  function findSimilarVenueWarning(venue: Venue) {
    const similarVenue = venues.find((existingVenue) => {
      const existingName = normalizeForMatch(existingVenue.name)
      const venueName = normalizeForMatch(venue.name)
      const existingAddress = normalizeForMatch(existingVenue.address)
      const venueAddress = normalizeForMatch(venue.address)
      const namesMatch =
        Boolean(existingName && venueName) &&
        (existingName === venueName ||
          existingName.includes(venueName) ||
          venueName.includes(existingName))
      const sameCity =
        normalizeForMatch(existingVenue.city) === normalizeForMatch(venue.city)
      const addressesMatch =
        Boolean(existingAddress && venueAddress) && existingAddress === venueAddress
      const coordinatesClose =
        getDistanceMeters(existingVenue.coordinates, venue.coordinates) <= 150

      return namesMatch || (sameCity && addressesMatch) || coordinatesClose
    })

    return similarVenue
      ? `Istnieje podobne miejsce: ${getVenueDisplayName(similarVenue)}. Zapisać mimo to?`
      : ''
  }

  async function removeVenue(venueId: string) {
    setPendingVenueAction(`delete-${venueId}`)
    const wasDeleted = await onDeleteVenue(venueId)
    setPendingVenueAction(null)

    if (wasDeleted && editingVenueId === venueId) {
      cancelEditing()
    }
  }

  async function saveVenueFromForm(venue: Venue) {
    if (!editingVenueId && prefilledVenueDraft) {
      const warning = findSimilarVenueWarning(venue)

      if (warning && !window.confirm(warning)) {
        return
      }
    }

    setPendingVenueAction(editingVenueId ? `save-${editingVenueId}` : 'save-new')

    try {
      if (editingVenueId) {
        await onUpdateVenue(venue)
        setSuccessMessage('Zaktualizowano miejsce.')
      } else {
        await onAddVenue(venue)
        setSuccessMessage('Zapisano miejsce.')
      }

      setEditingVenueId(null)
      setPrefilledVenueDraft(null)
    } finally {
      setPendingVenueAction(null)
    }
  }

  async function refreshData() {
    setIsRefreshingData(true)

    try {
      await onRefreshData()
      setSuccessMessage('Odświeżono dane.')
    } finally {
      setIsRefreshingData(false)
    }
  }

  function cancelVenueForm() {
    cancelEditing()
    setPrefilledVenueDraft(null)
    if (isAddingVenue) {
      onCancelMapMode()
    }
  }

  return (
    <motion.aside
      className="admin-panel"
      aria-label="Developerski panel admina"
      drag={drag}
      dragConstraints={dragConstraints}
      dragElastic={dragElastic}
      dragMomentum={dragMomentum}
      onDragEnd={onDragEnd}
    >
      <div className="venue-panel-handle" aria-hidden="true" />
      <div className="admin-panel-header">
        <div>
          <span>Tryb developerski</span>
          <h1>Panel admina</h1>
        </div>
        <div className="admin-panel-header-actions">
          <button
            className="admin-mode-disable"
            type="button"
            onClick={() => void refreshData()}
            disabled={isRefreshingData}
          >
            <RefreshCw className="ui-icon" aria-hidden="true" />
            {isRefreshingData ? 'Odświeżanie...' : 'Odśwież dane z Firestore'}
          </button>
          <button className="admin-mode-disable" type="button" onClick={onDisableAdminMode}>
            <ShieldOff className="ui-icon" aria-hidden="true" />
            Wyłącz tryb admina
          </button>
          <button
            className="admin-panel-close"
            type="button"
            onClick={onClose}
            aria-label="Zamknij panel admina"
          >
            <X className="ui-icon" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={contentRef} className="admin-panel-content">
        <div className="admin-tabs" role="tablist" aria-label="Sekcje panelu admina">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'venues'}
            className={activeTab === 'venues' ? 'is-active' : ''}
            onClick={() => setActiveTab('venues')}
          >
            Miejsca
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'events'}
            className={activeTab === 'events' ? 'is-active' : ''}
            onClick={() => {
              onCancelMapMode()
              setActiveTab('events')
            }}
          >
            Wydarzenia
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'data'}
            className={activeTab === 'data' ? 'is-active' : ''}
            onClick={() => {
              onCancelMapMode()
              setActiveTab('data')
            }}
          >
            Dane lokalne
          </button>
        </div>

        {activeTab === 'venues' ? (
          <>
            {(movingVenueId || isAddingVenue) && (
              <div className="admin-move-notice" role="status">
                <strong>
                  {isAddingVenue ? 'Dodawanie miejsca na mapie' : 'Przesuwanie pinezki jest aktywne'}
                </strong>
                <span>
                  {isAddingVenue
                    ? draftVenueCoordinates
                      ? 'Pinezka tymczasowa jest ustawiona. Uzupełnij formularz i zapisz miejsce.'
                      : 'Kliknij na mapie, aby ustawić pinezkę nowego miejsca.'
                    : 'Kliknij nowe miejsce na mapie albo anuluj operację.'}
                </span>
                <button type="button" onClick={onCancelMapMode}>
                  Anuluj
                </button>
              </div>
            )}

            <section className="admin-section" aria-labelledby="admin-venues-title">
              <div className="admin-section-heading">
                <h2 id="admin-venues-title">Miejsca</h2>
                <span>{venues.length}</span>
              </div>
              <button className="admin-add-map-button" type="button" onClick={startVenueAdd}>
                <MapPinPlus className="ui-icon" aria-hidden="true" />
                Dodaj miejsce na mapie
              </button>
              {venues.length > 0 ? (
                <ul className="admin-venue-list">
                  {venues.map((venue) => (
                    <li key={venue.id}>
                      <strong>{getVenueDisplayName(venue)}</strong>
                      <span>{venue.venueType} · {formatVenueAddress(venue)}</span>
                      <small>{venue.coordinates.lat}, {venue.coordinates.lng}</small>
                      <div className="admin-venue-actions">
                        <button type="button" onClick={() => startEditing(venue)}>
                          <Pencil className="ui-icon" aria-hidden="true" />
                          Edytuj
                        </button>
                        <button
                          type="button"
                          className={movingVenueId === venue.id ? 'is-active' : ''}
                          onClick={() => startPinMove(venue.id)}
                          disabled={movingVenueId === venue.id}
                        >
                          <Move className="ui-icon" aria-hidden="true" />
                          {movingVenueId === venue.id ? 'Przesuwanie…' : 'Przesuń pinezkę'}
                        </button>
                        <button
                          className="admin-list-delete"
                          type="button"
                          onClick={() => void removeVenue(venue.id)}
                          disabled={pendingVenueAction !== null}
                        >
                          <Trash2 className="ui-icon" aria-hidden="true" />
                          {pendingVenueAction === `delete-${venue.id}` ? 'Usuwanie...' : 'Usuń'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state admin-empty-state">
                  <strong>Brak miejsc</strong>
                  <p>Dodaj pierwsze miejsce za pomocą formularza poniżej.</p>
                </div>
              )}
            </section>

            <section className="admin-section" aria-labelledby="venue-form-title">
              <h2 id="venue-form-title">
                {editingVenueId
                  ? 'Edytuj miejsce'
                  : isTicketmasterVenueDraft
                    ? 'Dodaj pinezkę z Ticketmaster'
                    : isAddingVenueDraft
                      ? 'Dodaj miejsce z mapy'
                      : 'Dodaj miejsce'}
              </h2>
              {successMessage && (
                <p className="admin-form-message admin-form-success">{successMessage}</p>
              )}
              {prefilledVenueDraft && !prefilledVenueDraft.coordinates && (
                <p className="admin-form-message admin-form-error" role="alert">
                  Ticketmaster nie podał koordynatów. Ustaw pinezkę ręcznie albo wpisz latitude i longitude.
                </p>
              )}
              <VenueForm
                key={editingVenueId ?? `new-venue-${prefilledVenueDraftKey}`}
                initialVenue={editingVenue}
                initialDraft={prefilledVenueDraft ?? undefined}
                initialCoordinates={draftVenueCoordinates ?? undefined}
                onCoordinatesFromGoogleMapsUrl={
                  editingVenue ? undefined : onSetDraftVenueCoordinates
                }
                onAdjustTemporaryPin={onAdjustTemporaryPin}
                onSave={saveVenueFromForm}
                onCancel={
                  editingVenueId || isAddingVenue || prefilledVenueDraft
                    ? cancelVenueForm
                    : undefined
                }
              />
            </section>
          </>
        ) : activeTab === 'events' ? (
          <AdminEventsSection
            events={events}
            venues={venues}
            onAddEvent={onAddEvent}
            onCreateVenueDraft={openCreateVenueForm}
            onUpdateEvent={onUpdateEvent}
            onDeleteEvent={onDeleteEvent}
          />
        ) : (
          <AdminDataSection
            venues={venues}
            events={events}
            onImport={onImportData}
            onImportFirestore={onImportFirestoreData}
            onMoveCurrentDataToFirestore={onMoveCurrentDataToFirestore}
            onReset={onResetData}
            onClear={onClearData}
          />
        )}

        <p className="admin-storage-note">
          Dane testowe są zapisywane lokalnie w tej przeglądarce.
        </p>
      </div>
    </motion.aside>
  )
}
