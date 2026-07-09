import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { VENUE_TYPES } from '../data/searchFilters'
import type { Venue } from '../data/mockVenues'
import {
  isShortGoogleMapsUrl,
  isValidGoogleMapsUrl,
  parseGoogleMapsUrl,
} from '../utils/googleMaps'
import { normalizeVenueAddressInput } from '../utils/venueDisplay'

type VenueFormProps = {
  initialVenue?: Venue
  initialCoordinates?: Venue['coordinates']
  onCoordinatesFromGoogleMapsUrl?: (coordinates: Venue['coordinates']) => void
  onAdjustTemporaryPin?: () => void
  onSave: (venue: Venue) => void | Promise<void>
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

function createFormState(venue?: Venue, initialCoordinates?: Venue['coordinates']): VenueFormState {
  return venue
    ? {
        name: venue.name,
        city: venue.city,
        address: normalizeVenueAddressInput(venue.address, venue.city),
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
        lat: initialCoordinates?.lat.toFixed(6) ?? '',
        lng: initialCoordinates?.lng.toFixed(6) ?? '',
      }
}

export function VenueForm({
  initialVenue,
  initialCoordinates,
  onCoordinatesFromGoogleMapsUrl,
  onAdjustTemporaryPin,
  onSave,
  onCancel,
}: VenueFormProps) {
  const [form, setForm] = useState<VenueFormState>(() =>
    createFormState(initialVenue, initialCoordinates),
  )
  const [formError, setFormError] = useState('')
  const [formNotice, setFormNotice] = useState('')
  const previousInitialCoordinates = useRef(initialCoordinates)

  useEffect(() => {
    if (!initialCoordinates) {
      previousInitialCoordinates.current = initialCoordinates
      return
    }

    const previous = previousInitialCoordinates.current
    previousInitialCoordinates.current = initialCoordinates

    if (
      previous?.lat === initialCoordinates.lat &&
      previous?.lng === initialCoordinates.lng
    ) {
      return
    }

    setForm((current) => ({
      ...current,
      lat: initialCoordinates.lat.toFixed(6),
      lng: initialCoordinates.lng.toFixed(6),
    }))
  }, [initialCoordinates])

  function updateField(field: keyof VenueFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setFormError('')
    setFormNotice('')
  }

  function setCoordinatesFromGoogleMapsUrl() {
    const googleMapsUrl = form.googleMapsUrl.trim()

    if (!googleMapsUrl) {
      return
    }

    if (!isValidGoogleMapsUrl(googleMapsUrl)) {
      setFormError('Link Google Maps musi być poprawnym adresem URL.')
      setFormNotice('')
      return
    }

    const parsedUrl = parseGoogleMapsUrl(googleMapsUrl)
    const coordinates =
      typeof parsedUrl.lat === 'number' && typeof parsedUrl.lng === 'number'
        ? { lat: parsedUrl.lat, lng: parsedUrl.lng }
        : null
    const shouldUseParsedName = parsedUrl.name && !form.name.trim()

    if (!coordinates) {
      if (shouldUseParsedName) {
        setForm((current) => ({
          ...current,
          name: parsedUrl.name ?? current.name,
          googleMapsUrl,
        }))
      }

      setFormNotice('')
      setFormError(
        isShortGoogleMapsUrl(googleMapsUrl)
          ? 'To wygląda jak krótki link Google Maps. Otwórz go w przeglądarce, a potem skopiuj pełny adres URL z paska. Wtedy Event Times będzie mógł spróbować odczytać pozycję i nazwę.'
          : parsedUrl.name
            ? 'Udało się odczytać nazwę z linku, ale link nie zawiera współrzędnych. Skopiuj pełny adres z widoku mapy albo ustaw pinezkę kliknięciem na mapie.'
            : 'Ten link Google Maps jest poprawny, ale nie zawiera współrzędnych. Skopiuj pełny adres z widoku mapy albo ustaw pinezkę kliknięciem na mapie.',
      )
      return
    }

    if (
      initialVenue &&
      !window.confirm('Czy zaktualizować pozycję pinezki na podstawie linku Google Maps?')
    ) {
      return
    }

    setForm((current) => ({
      ...current,
      name: !current.name.trim() && parsedUrl.name ? parsedUrl.name : current.name,
      googleMapsUrl,
      lat: coordinates.lat.toFixed(6),
      lng: coordinates.lng.toFixed(6),
    }))
    onCoordinatesFromGoogleMapsUrl?.(coordinates)
    setFormError('')
    setFormNotice(
      initialVenue
        ? parsedUrl.name && form.name.trim()
          ? 'Dane z linku zostały odczytane. Nazwa nie została nadpisana, a współrzędne zapiszą się po zapisaniu formularza.'
          : 'Dane miejsca zostały odczytane z linku. Zapisz formularz, aby utrwalić zmianę.'
        : parsedUrl.name && !form.name.trim()
          ? 'Pinezka tymczasowa i nazwa miejsca zostały ustawione z linku. Możesz jeszcze dostosować pozycję.'
          : 'Pinezka tymczasowa została ustawiona z linku Google Maps. Możesz ją jeszcze dostosować.',
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const lat = Number(form.lat)
    const lng = Number(form.lng)
    const city = form.city.trim()
    const address = normalizeVenueAddressInput(form.address, city)
    const venueType = form.venueType.trim()

    if (!city) {
      setFormError('Podaj miasto miejsca.')
      return
    }

    if (!address) {
      setFormError('Podaj adres miejsca.')
      return
    }

    if (!venueType) {
      setFormError('Wybierz typ miejsca.')
      return
    }

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
      city,
      address,
      venueType,
      description: form.description.trim(),
      googleMapsUrl: googleMapsUrl || undefined,
      coordinates: { lat, lng },
    }

    try {
      await onSave(venue)

      if (!initialVenue) {
        setForm(createFormState(undefined, initialCoordinates))
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
        <span>Adres / ulica i numer</span>
        <input
          required
          placeholder="Krótka 4"
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

      <section className="admin-form-wide admin-google-maps-section" aria-label="Google Maps">
        <h3>Google Maps</h3>
        <p>
          Z linku Google Maps zwykle da się odczytać pozycję i czasem nazwę.
          Adres i opis uzupełnij ręcznie.
        </p>
      </section>

      <label className="admin-form-wide">
        <span>Opis</span>
        <textarea
          rows={4}
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
        />
      </label>

      <label className="admin-form-wide">
        <span>Link Google Maps</span>
        <input
          type="url"
          placeholder="Wklej link do miejsca z Google Maps"
          value={form.googleMapsUrl}
          onChange={(event) => updateField('googleMapsUrl', event.target.value)}
        />
        <small className="admin-field-help">
          Link do pinezki miejsca w Google Maps. Eventy przypisane do tego miejsca
          będą używać tego samego linku.
        </small>
      </label>
      <div className="admin-form-wide google-maps-coordinate-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={setCoordinatesFromGoogleMapsUrl}
          disabled={!form.googleMapsUrl.trim()}
        >
          {initialVenue ? 'Zaktualizuj pinezkę z linku' : 'Ustaw pinezkę z linku'}
        </button>
        {!initialVenue && form.lat && form.lng && onAdjustTemporaryPin && (
          <button
            className="button button-secondary"
            type="button"
            onClick={onAdjustTemporaryPin}
          >
            Dostosuj pozycję pinezki
          </button>
        )}
      </div>
      {!initialVenue && form.googleMapsUrl.trim() && form.lat && form.lng && (
        <p className="admin-form-wide google-maps-pin-status">
          Pinezka ustawiona z linku Google Maps. Możesz ją jeszcze dostosować.
        </p>
      )}

      <details className="admin-form-wide admin-advanced-fields" open={!initialCoordinates && !initialVenue}>
        <summary>Zaawansowane / współrzędne</summary>
        <div>
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
        </div>
      </details>

      {formError && (
        <p className="admin-form-message admin-form-error" role="alert">
          {formError}
        </p>
      )}
      {formNotice && (
        <p className="admin-form-message admin-form-success" role="status">
          {formNotice}
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
