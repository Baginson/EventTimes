import { useState } from 'react'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import type { LocalBackupData } from '../services/localBackupService'
import { formatVenueAddress, getVenueDisplayName } from '../utils/venueDisplay'
import { AdminDataSection } from './AdminDataSection'
import { AdminEventsSection } from './AdminEventsSection'
import { VenueForm } from './VenueForm'

type AdminPanelProps = {
  venues: Venue[]
  events: EventTimesEvent[]
  movingVenueId: string | null
  isAddingVenue: boolean
  draftVenueCoordinates: Venue['coordinates'] | null
  onAddVenue: (venue: Venue) => void | Promise<void>
  onUpdateVenue: (venue: Venue) => void | Promise<void>
  onDeleteVenue: (venueId: string) => boolean
  onAddEvent: (event: EventTimesEvent) => void | Promise<void>
  onUpdateEvent: (event: EventTimesEvent) => void | Promise<void>
  onDeleteEvent: (eventId: string) => boolean
  onImportData: (backup: LocalBackupData) => void
  onImportFirestoreData: (backup: LocalBackupData) => Promise<void>
  onMoveCurrentDataToFirestore: () => Promise<void>
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
  const editingVenue = venues.find((venue) => venue.id === editingVenueId)
  const isAddingVenueDraft = isAddingVenue && draftVenueCoordinates !== null

  function startEditing(venue: Venue) {
    onCancelMapMode()
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
    setActiveTab('venues')
    setSuccessMessage('')
    onStartVenueAdd()
  }

  function removeVenue(venueId: string) {
    if (onDeleteVenue(venueId) && editingVenueId === venueId) {
      cancelEditing()
    }
  }

  async function saveVenueFromForm(venue: Venue) {
    if (editingVenueId) {
      await onUpdateVenue(venue)
      setSuccessMessage(`Zapisano zmiany: ${getVenueDisplayName(venue)}`)
    } else {
      await onAddVenue(venue)
      setSuccessMessage(`Dodano miejsce: ${getVenueDisplayName(venue)}`)
    }

    setEditingVenueId(null)
  }

  function cancelVenueForm() {
    cancelEditing()
    if (isAddingVenue) {
      onCancelMapMode()
    }
  }

  return (
    <aside className="admin-panel" aria-label="Developerski panel admina">
      <div className="admin-panel-header">
        <div>
          <span>Tryb developerski</span>
          <h1>Panel admina</h1>
        </div>
        <div className="admin-panel-header-actions">
          <button className="admin-mode-disable" type="button" onClick={onDisableAdminMode}>
            Wyłącz tryb admina
          </button>
          <button
            className="admin-panel-close"
            type="button"
            onClick={onClose}
            aria-label="Zamknij panel admina"
          >
            ×
          </button>
        </div>
      </div>

      <div className="admin-panel-content">
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
                          Edytuj
                        </button>
                        <button
                          type="button"
                          className={movingVenueId === venue.id ? 'is-active' : ''}
                          onClick={() => startPinMove(venue.id)}
                          disabled={movingVenueId === venue.id}
                        >
                          {movingVenueId === venue.id ? 'Przesuwanie…' : 'Przesuń pinezkę'}
                        </button>
                        <button
                          className="admin-list-delete"
                          type="button"
                          onClick={() => removeVenue(venue.id)}
                        >
                          Usuń
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
                {editingVenueId ? 'Edytuj miejsce' : isAddingVenueDraft ? 'Dodaj miejsce z mapy' : 'Dodaj miejsce'}
              </h2>
              {successMessage && (
                <p className="admin-form-message admin-form-success">{successMessage}</p>
              )}
              <VenueForm
                key={editingVenueId ?? 'new-venue'}
                initialVenue={editingVenue}
                initialCoordinates={draftVenueCoordinates ?? undefined}
                onCoordinatesFromGoogleMapsUrl={
                  editingVenue ? undefined : onSetDraftVenueCoordinates
                }
                onAdjustTemporaryPin={onAdjustTemporaryPin}
                onSave={saveVenueFromForm}
                onCancel={editingVenueId || isAddingVenue ? cancelVenueForm : undefined}
              />
            </section>
          </>
        ) : activeTab === 'events' ? (
          <AdminEventsSection
            events={events}
            venues={venues}
            onAddEvent={onAddEvent}
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
    </aside>
  )
}
