import { useState } from 'react'
import type { FormEvent } from 'react'
import { VENUE_TYPES } from '../data/searchFilters'
import type { Venue } from '../data/mockVenues'
import { isValidGoogleMapsUrl } from '../utils/googleMaps'

type VenueFormProps = {
  initialVenue?: Venue
  onSave: (venue: Venue) => void
  onCancel?: () => void
}

type VenueFormState = {
  name: string
  city: string
  address: string
  venueType: string
  description: string
  googleMapsUrl: string
  lat: string
  lng: string
}

const availableVenueTypes = VENUE_TYPES.filter((venueType) => venueType !== 'Wszystkie')

function createVenueId() {
  const uniquePart = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)
  return `venue-${uniquePart}`
}

function createFormState(venue?: Venue): VenueFormState {
  return venue
    ? {
        name: venue.name,
        city: venue.city,
        address: venue.address,
        venueType: venue.venueType,
        description: venue.description,
        googleMapsUrl: venue.googleMapsUrl ?? '',
        lat: venue.coordinates.lat.toString(),
        lng: venue.coordinates.lng.toString(),
      }
    : {
        name: '',
        city: 'Leszno',
        address: '',
        venueType: 'Inne',
        description: '',
        googleMapsUrl: '',
        lat: '',
        lng: '',
      }
}

export function VenueForm({ initialVenue, onSave, onCancel }: VenueFormProps) {
  const [form, setForm] = useState<VenueFormState>(() => createFormState(initialVenue))
  const [formError, setFormError] = useState('')

  function updateField(field: keyof VenueFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setFormError('')
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

    const googleMapsUrl = form.googleMapsUrl.trim()

    if (googleMapsUrl && !isValidGoogleMapsUrl(googleMapsUrl)) {
      setFormError('Link Google Maps musi być poprawnym adresem URL.')
      return
    }

    const venue: Venue = {
      id: initialVenue?.id ?? createVenueId(),
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      venueType: form.venueType,
      description: form.description.trim(),
      googleMapsUrl: googleMapsUrl || undefined,
      coordinates: { lat, lng },
    }

    try {
      onSave(venue)

      if (!initialVenue) {
        setForm(createFormState())
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Nie udało się zapisać miejsca.',
      )
    }
  }

  return (
    <form className="admin-form context-form" onSubmit={handleSubmit}>
      <label>
        <span>Nazwa miejsca</span>
        <input
          required
          autoFocus
          value={form.name}
          onChange={(event) => updateField('name', event.target.value)}
        />
      </label>

      <label>
        <span>Miasto</span>
        <input
          required
          value={form.city}
          onChange={(event) => updateField('city', event.target.value)}
        />
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

      <label className="admin-form-wide">
        <span>Link Google Maps</span>
        <input
          type="url"
          placeholder="Wklej link do miejsca w Google Maps"
          value={form.googleMapsUrl}
          onChange={(event) => updateField('googleMapsUrl', event.target.value)}
        />
        <small className="admin-field-help">
          Link do pinezki miejsca w Google Maps. Eventy przypisane do tego miejsca
          będą używać tego samego linku.
        </small>
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

      {formError && (
        <p className="admin-form-message admin-form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="admin-form-actions">
        <button className="button button-primary" type="submit">
          Zapisz
        </button>
        {onCancel && (
          <button className="button button-secondary" type="button" onClick={onCancel}>
            Anuluj
          </button>
        )}
      </div>
    </form>
  )
}
