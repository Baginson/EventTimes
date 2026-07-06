import { useState } from 'react'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import type { LocalBackupData } from '../services/localBackupService'
import { AdminDataSection } from './AdminDataSection'
import { AdminEventsSection } from './AdminEventsSection'
import { VenueForm } from './VenueForm'

type AdminPanelProps = {
  venues: Venue[]
  events: EventTimesEvent[]
  movingVenueId: string | null
  onAddVenue: (venue: Venue) => void
  onUpdateVenue: (venue: Venue) => void
  onDeleteVenue: (venueId: string) => boolean
  onAddEvent: (event: EventTimesEvent) => void
  onUpdateEvent: (event: EventTimesEvent) => void
  onDeleteEvent: (eventId: string) => boolean
  onImportData: (backup: LocalBackupData) => void
  onResetData: () => void
  onClearData: () => void
  onStartPinMove: (venueId: string) => void
  onCancelPinMove: () => void
  onDisableAdminMode: () => void
  onClose: () => void
}

export function AdminPanel({
  venues,
  events,
  movingVenueId,
  onAddVenue,
  onUpdateVenue,
  onDeleteVenue,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onImportData,
  onResetData,
  onClearData,
  onStartPinMove,
  onCancelPinMove,
  onDisableAdminMode,
  onClose,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'venues' | 'events' | 'data'>('venues')
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const editingVenue = venues.find((venue) => venue.id === editingVenueId)

  function startEditing(venue: Venue) {
    onCancelPinMove()
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

  function removeVenue(venueId: string) {
    if (onDeleteVenue(venueId) && editingVenueId === venueId) {
      cancelEditing()
    }
  }

  function saveVenueFromForm(venue: Venue) {
    if (editingVenueId) {
      onUpdateVenue(venue)
      setSuccessMessage(`Zapisano zmiany: ${venue.name}`)
    } else {
      onAddVenue(venue)
      setSuccessMessage(`Dodano miejsce: ${venue.name}`)
    }

    setEditingVenueId(null)
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
              onCancelPinMove()
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
              onCancelPinMove()
              setActiveTab('data')
            }}
          >
            Dane lokalne
          </button>
        </div>

        {activeTab === 'venues' ? (
          <>
            {movingVenueId && (
              <div className="admin-move-notice" role="status">
                <strong>Przesuwanie pinezki jest aktywne</strong>
                <span>Kliknij nowe miejsce na mapie albo anuluj operację.</span>
                <button type="button" onClick={onCancelPinMove}>
                  Anuluj przesuwanie
                </button>
              </div>
            )}

            <section className="admin-section" aria-labelledby="admin-venues-title">
              <div className="admin-section-heading">
                <h2 id="admin-venues-title">Miejsca</h2>
                <span>{venues.length}</span>
              </div>
              {venues.length > 0 ? (
                <ul className="admin-venue-list">
                  {venues.map((venue) => (
                    <li key={venue.id}>
                      <strong>{venue.name}</strong>
                      <span>{venue.venueType} · {venue.address}</span>
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
                {editingVenueId ? 'Edytuj miejsce' : 'Dodaj miejsce'}
              </h2>
              {successMessage && (
                <p className="admin-form-message admin-form-success">{successMessage}</p>
              )}
              <VenueForm
                key={editingVenueId ?? 'new-venue'}
                initialVenue={editingVenue}
                onSave={saveVenueFromForm}
                onCancel={editingVenueId ? cancelEditing : undefined}
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
