import { useState } from 'react'
import type { FormEvent } from 'react'
import { VENUE_TYPES } from '../data/searchFilters'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import type { LocalBackupData } from '../services/localBackupService'
import { AdminDataSection } from './AdminDataSection'
import { AdminEventsSection } from './AdminEventsSection'

type AdminPanelProps = {
  venues: Venue[]
  events: EventTimesEvent[]
  movingVenueId: string | null
  onAddVenue: (venue: Venue) => void
  onUpdateVenue: (venue: Venue) => void
  onAddEvent: (event: EventTimesEvent) => void
  onUpdateEvent: (event: EventTimesEvent) => void
  onImportData: (backup: LocalBackupData) => void
  onResetData: () => void
  onClearData: () => void
  onStartPinMove: (venueId: string) => void
  onCancelPinMove: () => void
  onClose: () => void
}

type VenueFormState = {
  name: string
  city: string
  address: string
  venueType: string
  description: string
  lat: string
  lng: string
}

const initialFormState: VenueFormState = {
  name: '',
  city: 'Leszno',
  address: '',
  venueType: 'Inne',
  description: '',
  lat: '',
  lng: '',
}

const availableVenueTypes = VENUE_TYPES.filter((venueType) => venueType !== 'Wszystkie')

function createVenueId() {
  const uniquePart = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)
  return `venue-${uniquePart}`
}

function venueToForm(venue: Venue): VenueFormState {
  return {
    name: venue.name,
    city: venue.city,
    address: venue.address,
    venueType: venue.venueType,
    description: venue.description,
    lat: venue.coordinates.lat.toString(),
    lng: venue.coordinates.lng.toString(),
  }
}

export function AdminPanel({
  venues,
  events,
  movingVenueId,
  onAddVenue,
  onUpdateVenue,
  onAddEvent,
  onUpdateEvent,
  onImportData,
  onResetData,
  onClearData,
  onStartPinMove,
  onCancelPinMove,
  onClose,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'venues' | 'events' | 'data'>('venues')
  const [form, setForm] = useState<VenueFormState>(initialFormState)
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  function updateField(field: keyof VenueFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setFormError('')
    setSuccessMessage('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const lat = Number(form.lat)
    const lng = Number(form.lng)

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setFormError('Latitude musi być liczbą od -90 do 90.')
      return
    }

    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setFormError('Longitude musi być liczbą od -180 do 180.')
      return
    }

    const venue: Venue = {
      id: editingVenueId ?? createVenueId(),
      name: form.name.trim(),
      city: form.city,
      address: form.address.trim(),
      venueType: form.venueType,
      description: form.description.trim(),
      coordinates: { lat, lng },
    }

    try {
      if (editingVenueId) {
        onUpdateVenue(venue)
        setSuccessMessage(`Zapisano zmiany: ${venue.name}`)
      } else {
        onAddVenue(venue)
        setSuccessMessage(`Dodano miejsce: ${venue.name}`)
      }

      setForm(initialFormState)
      setEditingVenueId(null)
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Nie udało się zapisać miejsca.',
      )
    }
  }

  function startEditing(venue: Venue) {
    onCancelPinMove()
    setEditingVenueId(venue.id)
    setForm(venueToForm(venue))
    setFormError('')
    setSuccessMessage('')
  }

  function cancelEditing() {
    setEditingVenueId(null)
    setForm(initialFormState)
    setFormError('')
    setSuccessMessage('')
  }

  function startPinMove(venueId: string) {
    cancelEditing()
    onStartPinMove(venueId)
  }

  return (
    <aside className="admin-panel" aria-label="Developerski panel admina">
      <div className="admin-panel-header">
        <div>
          <span>Tryb developerski</span>
          <h1>Panel admina</h1>
        </div>
        <button type="button" onClick={onClose} aria-label="Zamknij panel admina">
          ×
        </button>
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
                <small>
                  {venue.coordinates.lat}, {venue.coordinates.lng}
                </small>
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
          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              <span>Nazwa miejsca</span>
              <input
                required
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
            </label>

            <label>
              <span>Miasto</span>
              <select
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
              >
                <option value="Leszno">Leszno</option>
              </select>
            </label>

            <label>
              <span>Adres</span>
              <input
                required
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
              />
            </label>

            <label>
              <span>Typ miejsca</span>
              <select
                value={form.venueType}
                onChange={(event) => updateField('venueType', event.target.value)}
              >
                {availableVenueTypes.map((venueType) => (
                  <option key={venueType} value={venueType}>
                    {venueType}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-wide">
              <span>Opis</span>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
              />
            </label>

            <label>
              <span>Latitude / lat</span>
              <input
                required
                type="number"
                step="any"
                min="-90"
                max="90"
                placeholder="51.8419"
                value={form.lat}
                onChange={(event) => updateField('lat', event.target.value)}
              />
            </label>

            <label>
              <span>Longitude / lng</span>
              <input
                required
                type="number"
                step="any"
                min="-180"
                max="180"
                placeholder="16.5748"
                value={form.lng}
                onChange={(event) => updateField('lng', event.target.value)}
              />
            </label>

            {formError && <p className="admin-form-message admin-form-error">{formError}</p>}
            {successMessage && (
              <p className="admin-form-message admin-form-success">{successMessage}</p>
            )}

            <div className="admin-form-actions">
              <button className="button button-primary admin-submit" type="submit">
                {editingVenueId ? 'Zapisz zmiany' : 'Dodaj miejsce'}
              </button>
              {editingVenueId && (
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={cancelEditing}
                >
                  Anuluj edycję
                </button>
              )}
            </div>
          </form>
        </section>
          </>
        ) : activeTab === 'events' ? (
          <AdminEventsSection
            events={events}
            venues={venues}
            onAddEvent={onAddEvent}
            onUpdateEvent={onUpdateEvent}
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
