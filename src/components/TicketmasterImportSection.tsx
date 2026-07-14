import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { EVENT_TYPES } from '../data/searchFilters'
import { createEventExternalImage, getEventTitle } from '../features/events/eventModel'
import type { TicketmasterImportCandidate } from '../services/ticketmasterService'
import { formatEventDate } from '../utils/eventStatus'
import { formatVenueAddress, getVenueDisplayName } from '../utils/venueDisplay'
import type { VenueFormDraft } from './VenueForm'

type TicketmasterImportSectionProps = {
  events: EventTimesEvent[]
  venues: Venue[]
  onAddEvent: (event: EventTimesEvent) => void | Promise<void>
  onCreateVenueDraft: (draft: VenueFormDraft) => void
}

type SearchForm = {
  keyword: string
  city: string
  radius: string
  startDate: string
  endDate: string
}

const TICKETMASTER_IMPORTER_ENABLED = Boolean(import.meta.env.VITE_TICKETMASTER_API_KEY)
const availableEventTypes = EVENT_TYPES.filter((eventType) => eventType !== 'Wszystkie')

function createId(prefix: string, value: string) {
  const normalizedValue = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pl-PL')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const uniquePart = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)
  return `${prefix}-${normalizedValue || uniquePart}`
}

function normalizeText(value?: string) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pl-PL')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getTicketmasterVenueName(candidate: TicketmasterImportCandidate) {
  return candidate.venueName ?? candidate.venueCandidate?.name
}

function getTicketmasterVenueCity(candidate: TicketmasterImportCandidate) {
  return candidate.venueCity ?? candidate.venueCandidate?.city
}

function getTicketmasterVenueAddress(candidate: TicketmasterImportCandidate) {
  return candidate.venueAddress ?? candidate.venueCandidate?.address
}

function getTicketmasterVenueCoordinates(candidate: TicketmasterImportCandidate) {
  return candidate.coordinates ?? candidate.venueCandidate?.coordinates
}

function isLikelySameVenue(candidate: TicketmasterImportCandidate, venue: Venue) {
  const candidateName = normalizeText(getTicketmasterVenueName(candidate))
  const venueName = normalizeText(venue.name)
  const candidateCity = normalizeText(getTicketmasterVenueCity(candidate))
  const venueCity = normalizeText(venue.city)
  const candidateAddress = normalizeText(getTicketmasterVenueAddress(candidate))
  const venueAddress = normalizeText(venue.address)
  const candidateCoordinates = getTicketmasterVenueCoordinates(candidate)

  if (!candidateName || !venueName) {
    return false
  }

  const namesMatch =
    candidateName === venueName ||
    candidateName.includes(venueName) ||
    venueName.includes(candidateName)
  const citiesMatch = !candidateCity || !venueCity || candidateCity === venueCity
  const addressesMatch =
    Boolean(candidateAddress && venueAddress) &&
    (candidateAddress === venueAddress ||
      candidateAddress.includes(venueAddress) ||
      venueAddress.includes(candidateAddress))
  const coordinatesClose =
    candidateCoordinates &&
    getDistanceMeters(candidateCoordinates, venue.coordinates) <= 150

  return (namesMatch && citiesMatch) || (citiesMatch && addressesMatch) || Boolean(coordinatesClose)
}

function findSuggestedVenueId(candidate: TicketmasterImportCandidate, venues: Venue[]) {
  return venues.find((venue) => isLikelySameVenue(candidate, venue))?.id ?? ''
}

function getDistanceMeters(
  first: Venue['coordinates'],
  second: Venue['coordinates'],
) {
  const latMeters = (first.lat - second.lat) * 111_320
  const lngMeters =
    (first.lng - second.lng) *
    111_320 *
    Math.cos(((first.lat + second.lat) / 2) * (Math.PI / 180))

  return Math.sqrt(latMeters ** 2 + lngMeters ** 2)
}

function buildGoogleMapsUrl(coordinates?: Venue['coordinates']) {
  if (!coordinates) {
    return undefined
  }

  const query = `${coordinates.lat},${coordinates.lng}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function isDuplicateCandidate(
  candidate: TicketmasterImportCandidate,
  selectedVenueId: string,
  events: EventTimesEvent[],
) {
  return events.some((event) => {
    if (event.externalIds?.ticketmaster === candidate.ticketmasterId) {
      return true
    }

    return (
      selectedVenueId &&
      event.venueId === selectedVenueId &&
      normalizeText(getEventTitle(event)) === normalizeText(candidate.name) &&
      event.startDate === candidate.startDate
    )
  })
}

function createEventFromCandidate(
  candidate: TicketmasterImportCandidate,
  venueId: string,
): EventTimesEvent {
  const externalImage = createEventExternalImage(
    `ticketmaster-${candidate.ticketmasterId}`,
    candidate.imageUrl,
    candidate.name,
  )

  return {
    id: createId('ticketmaster', candidate.ticketmasterId),
    venueId,
    name: candidate.name,
    eventType: candidate.eventType,
    category: candidate.eventType,
    description: 'Zaimportowano z Ticketmaster. Opis można uzupełnić ręcznie.',
    startDate: candidate.startDate,
    endDate: candidate.endDate,
    ticketUrl: candidate.ticketUrl,
    sourceUrl: candidate.sourceUrl,
    imageUrl: candidate.imageUrl,
    images: externalImage ? [externalImage] : undefined,
    externalIds: {
      ticketmaster: candidate.ticketmasterId,
    },
  }
}

function createVenueDraftFromCandidate(
  candidate: TicketmasterImportCandidate,
): VenueFormDraft {
  const coordinates = getTicketmasterVenueCoordinates(candidate)

  return {
    name: getTicketmasterVenueName(candidate) ?? '',
    city: getTicketmasterVenueCity(candidate) ?? 'Leszno',
    address: getTicketmasterVenueAddress(candidate) ?? '',
    venueType: 'Inne',
    description: '',
    googleMapsUrl: buildGoogleMapsUrl(coordinates),
    imageUrl: '',
    coordinates,
  }
}

function getTicketmasterErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Nie udało się połączyć z Ticketmaster. Sprawdź sieć i spróbuj ponownie.'
}

export function TicketmasterImportSection({
  events,
  venues,
  onAddEvent,
  onCreateVenueDraft,
}: TicketmasterImportSectionProps) {
  const hasApiKey = TICKETMASTER_IMPORTER_ENABLED
  const [form, setForm] = useState<SearchForm>({
    keyword: '',
    city: 'Leszno',
    radius: '50',
    startDate: '',
    endDate: '',
  })
  const [candidates, setCandidates] = useState<TicketmasterImportCandidate[]>([])
  const [venueChoices, setVenueChoices] = useState<Record<string, string>>({})
  const [statusMessages, setStatusMessages] = useState<Record<string, string>>({})
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [noticeMessage, setNoticeMessage] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [pendingImportId, setPendingImportId] = useState<string | null>(null)

  const venueOptions = useMemo(
    () =>
      [...venues].sort((first, second) =>
        getVenueDisplayName(first).localeCompare(getVenueDisplayName(second), 'pl-PL'),
      ),
    [venues],
  )

  function updateField(field: keyof SearchForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrorMessage('')
    setNoticeMessage('')
  }

  function updateCandidate(ticketmasterId: string, patch: Partial<TicketmasterImportCandidate>) {
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.ticketmasterId === ticketmasterId
          ? { ...candidate, ...patch }
          : candidate,
      ),
    )
    setStatusMessages((current) => ({ ...current, [ticketmasterId]: '' }))
  }

  function updateCandidateCoordinate(
    candidate: TicketmasterImportCandidate,
    axis: 'lat' | 'lng',
    value: string,
  ) {
    const parsedValue = Number(value)
    const coordinates =
      value.trim() && Number.isFinite(parsedValue)
        ? {
            lat: axis === 'lat' ? parsedValue : candidate.coordinates?.lat ?? 0,
            lng: axis === 'lng' ? parsedValue : candidate.coordinates?.lng ?? 0,
          }
        : undefined

    updateCandidate(candidate.ticketmasterId, { coordinates })
  }

  function rejectCandidate(ticketmasterId: string) {
    setCandidates((current) =>
      current.filter((candidate) => candidate.ticketmasterId !== ticketmasterId),
    )
    setVenueChoices((current) => {
      const { [ticketmasterId]: _removedChoice, ...nextChoices } = current
      return nextChoices
    })
    setStatusMessages((current) => {
      const { [ticketmasterId]: _removedMessage, ...nextMessages } = current
      return nextMessages
    })

    if (editingCandidateId === ticketmasterId) {
      setEditingCandidateId(null)
    }
  }

  async function searchEvents(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!hasApiKey) {
      setErrorMessage('Brak VITE_TICKETMASTER_API_KEY w .env.local')
      return
    }

    if (!form.keyword.trim() && !form.city.trim()) {
      setErrorMessage('Podaj keyword albo miasto.')
      return
    }

    setIsSearching(true)
    setErrorMessage('')
    setNoticeMessage('')
    setStatusMessages({})

    try {
      const { searchTicketmasterEvents } = await import('../services/ticketmasterService')
      const results = await searchTicketmasterEvents({
        keyword: form.keyword,
        city: form.city,
        radius: form.radius,
        startDateTime: form.startDate,
        endDateTime: form.endDate,
        size: 20,
      })
      const nextVenueChoices = Object.fromEntries(
        results.map((candidate) => [
          candidate.ticketmasterId,
          findSuggestedVenueId(candidate, venues),
        ]),
      )

      setCandidates(results)
      setVenueChoices(nextVenueChoices)
      setNoticeMessage(
        results.length ? `Znaleziono ${results.length} wyników.` : 'Brak wyników w Ticketmaster.',
      )
    } catch (error) {
      setCandidates([])
      setErrorMessage(getTicketmasterErrorMessage(error))
    } finally {
      setIsSearching(false)
    }
  }

  async function importCandidate(candidate: TicketmasterImportCandidate) {
    const venueChoice = venueChoices[candidate.ticketmasterId] ?? ''

    if (isDuplicateCandidate(candidate, venueChoice, events)) {
      setStatusMessages((current) => ({
        ...current,
        [candidate.ticketmasterId]: 'Już zaimportowano.',
      }))
      return
    }

    if (!venueChoice) {
      setStatusMessages((current) => ({
        ...current,
        [candidate.ticketmasterId]: 'Wybierz miejsce wydarzenia.',
      }))
      return
    }

    setPendingImportId(candidate.ticketmasterId)

    try {
      const venueId = venueChoice

      if (isDuplicateCandidate(candidate, venueId, events)) {
        setStatusMessages((current) => ({
          ...current,
          [candidate.ticketmasterId]: 'Już zaimportowano.',
        }))
        return
      }

      await onAddEvent(createEventFromCandidate(candidate, venueId))
      setStatusMessages((current) => ({
        ...current,
        [candidate.ticketmasterId]: 'Zaimportowano.',
      }))
    } catch (error) {
      setStatusMessages((current) => ({
        ...current,
        [candidate.ticketmasterId]:
          error instanceof Error ? error.message : 'Nie udało się zaimportować wydarzenia.',
      }))
    } finally {
      setPendingImportId(null)
    }
  }

  return (
    <section className="admin-section ticketmaster-import" aria-labelledby="ticketmaster-import-title">
      <div className="admin-section-heading">
        <div>
          <h2 id="ticketmaster-import-title">Import z Ticketmaster</h2>
          <p>Opcjonalny importer admin/dev. Wymaga VITE_TICKETMASTER_API_KEY i nie zapisuje nic bez akceptacji admina.</p>
        </div>
      </div>

      {!hasApiKey && (
        <p className="admin-form-message admin-form-error" role="alert">
          Brak VITE_TICKETMASTER_API_KEY w .env.local
        </p>
      )}

      <form className="admin-form ticketmaster-search-form" onSubmit={searchEvents}>
        <label>
          <span>Keyword</span>
          <input
            value={form.keyword}
            onChange={(event) => updateField('keyword', event.target.value)}
            placeholder="np. koncert"
          />
        </label>

        <label>
          <span>Miasto</span>
          <input
            value={form.city}
            onChange={(event) => updateField('city', event.target.value)}
          />
        </label>

        <label>
          <span>Radius (km)</span>
          <input
            min="1"
            max="500"
            type="number"
            value={form.radius}
            onChange={(event) => updateField('radius', event.target.value)}
          />
        </label>

        <label>
          <span>Data od</span>
          <input
            type="date"
            value={form.startDate}
            onChange={(event) => updateField('startDate', event.target.value)}
          />
        </label>

        <label>
          <span>Data do</span>
          <input
            type="date"
            value={form.endDate}
            onChange={(event) => updateField('endDate', event.target.value)}
          />
        </label>

        <div className="admin-form-wide admin-form-actions">
          <button className="button button-primary" type="submit" disabled={isSearching}>
            {isSearching ? 'Szukanie...' : 'Szukaj w Ticketmaster'}
          </button>
        </div>

        {errorMessage && (
          <p className="admin-form-message admin-form-error" role="alert">
            {errorMessage}
          </p>
        )}
        {noticeMessage && (
          <p className="admin-form-message admin-form-success" role="status">
            {noticeMessage}
          </p>
        )}
      </form>

      {candidates.length > 0 && (
        <ul className="ticketmaster-results">
          {candidates.map((candidate) => {
            const selectedVenueId = venueChoices[candidate.ticketmasterId] ?? ''
            const isImported = isDuplicateCandidate(candidate, selectedVenueId, events)
            const statusMessage =
              statusMessages[candidate.ticketmasterId] ??
              (isImported ? 'Już zaimportowano.' : '')
            const selectedVenue = venues.find((venue) => venue.id === selectedVenueId)
            const isEditing = editingCandidateId === candidate.ticketmasterId
            const ticketmasterVenueName = getTicketmasterVenueName(candidate)
            const ticketmasterVenueCity = getTicketmasterVenueCity(candidate)
            const ticketmasterVenueAddress = getTicketmasterVenueAddress(candidate)
            const ticketmasterVenueCoordinates = getTicketmasterVenueCoordinates(candidate)
            const hasVenueCandidate = Boolean(ticketmasterVenueName)

            return (
              <li key={candidate.ticketmasterId} className="ticketmaster-result-card">
                {candidate.imageUrl && (
                  <img src={candidate.imageUrl} alt="" loading="lazy" />
                )}
                <div className="ticketmaster-result-main">
                  <strong>{candidate.name}</strong>
                  <span>{formatEventDate(candidate.startDate)} · {candidate.eventType}</span>
                  <span>
                    {candidate.venueName ?? 'Brak venue w odpowiedzi'} ·{' '}
                    {candidate.venueCity ?? 'brak miasta'}
                  </span>
                  {candidate.venueAddress && <small>{candidate.venueAddress}</small>}
                  {selectedVenue && (
                    <small>Dopasowano: {getVenueDisplayName(selectedVenue)}</small>
                  )}
                  {!candidate.coordinates && (
                    <small>Ticketmaster nie podał koordynatów miejsca.</small>
                  )}
                  {candidate.sourceUrl && (
                    <a href={candidate.sourceUrl} target="_blank" rel="noreferrer">
                      Otwórz źródło
                    </a>
                  )}
                </div>

                <section className="ticketmaster-venue-card" aria-label="Miejsce z Ticketmaster">
                  <div>
                    <span>Miejsce z Ticketmaster</span>
                    <strong>{ticketmasterVenueName ?? 'Brak venue w odpowiedzi'}</strong>
                  </div>
                  {ticketmasterVenueCity && <small>Miasto: {ticketmasterVenueCity}</small>}
                  {ticketmasterVenueAddress && <small>Adres: {ticketmasterVenueAddress}</small>}
                  {ticketmasterVenueCoordinates ? (
                    <small>
                      Koordynaty: {ticketmasterVenueCoordinates.lat}, {ticketmasterVenueCoordinates.lng}
                    </small>
                  ) : (
                    <small>Brak koordynatów. Admin musi ustawić pinezkę ręcznie.</small>
                  )}
                  {selectedVenue ? (
                    <p className="ticketmaster-venue-status is-matched">
                      Dopasowano do istniejącej pinezki: {getVenueDisplayName(selectedVenue)}
                    </p>
                  ) : (
                    <p className="ticketmaster-venue-status">Brak pinezki w Event Times</p>
                  )}
                  {!selectedVenue && hasVenueCandidate && (
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => onCreateVenueDraft(createVenueDraftFromCandidate(candidate))}
                    >
                      Utwórz pinezkę z Ticketmaster
                    </button>
                  )}
                </section>

                <div className="ticketmaster-result-actions">
                  {isEditing && (
                    <div className="ticketmaster-edit-form">
                      <label>
                        <span>Nazwa</span>
                        <input
                          value={candidate.name}
                          onChange={(event) =>
                            updateCandidate(candidate.ticketmasterId, {
                              name: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Typ</span>
                        <select
                          value={candidate.eventType}
                          onChange={(event) =>
                            updateCandidate(candidate.ticketmasterId, {
                              eventType: event.target.value,
                            })
                          }
                        >
                          {availableEventTypes.map((eventType) => (
                            <option key={eventType} value={eventType}>
                              {eventType}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Data startu</span>
                        <input
                          value={candidate.startDate}
                          onChange={(event) =>
                            updateCandidate(candidate.ticketmasterId, {
                              startDate: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Link biletu</span>
                        <input
                          value={candidate.ticketUrl ?? ''}
                          onChange={(event) =>
                            updateCandidate(candidate.ticketmasterId, {
                              ticketUrl: event.target.value || undefined,
                              sourceUrl: event.target.value || candidate.sourceUrl,
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Image URL</span>
                        <input
                          value={candidate.imageUrl ?? ''}
                          onChange={(event) =>
                            updateCandidate(candidate.ticketmasterId, {
                              imageUrl: event.target.value || undefined,
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Miejsce</span>
                        <input
                          value={candidate.venueName ?? ''}
                          onChange={(event) =>
                            updateCandidate(candidate.ticketmasterId, {
                              venueName: event.target.value || undefined,
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Miasto</span>
                        <input
                          value={candidate.venueCity ?? ''}
                          onChange={(event) =>
                            updateCandidate(candidate.ticketmasterId, {
                              venueCity: event.target.value || undefined,
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Adres</span>
                        <input
                          value={candidate.venueAddress ?? ''}
                          onChange={(event) =>
                            updateCandidate(candidate.ticketmasterId, {
                              venueAddress: event.target.value || undefined,
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Lat</span>
                        <input
                          value={candidate.coordinates?.lat ?? ''}
                          onChange={(event) =>
                            updateCandidateCoordinate(candidate, 'lat', event.target.value)
                          }
                        />
                      </label>
                      <label>
                        <span>Lng</span>
                        <input
                          value={candidate.coordinates?.lng ?? ''}
                          onChange={(event) =>
                            updateCandidateCoordinate(candidate, 'lng', event.target.value)
                          }
                        />
                      </label>
                    </div>
                  )}
                  <label>
                    <span>Miejsce w Event Times</span>
                    <select
                      value={selectedVenueId}
                      onChange={(event) =>
                        setVenueChoices((current) => ({
                          ...current,
                          [candidate.ticketmasterId]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Wybierz venue</option>
                      {venueOptions.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {getVenueDisplayName(venue)} · {formatVenueAddress(venue)}
                        </option>
                      ))}
                    </select>
                  </label>

                  {statusMessage && (
                    <p
                      className={`ticketmaster-import-status ${
                        isImported || statusMessage === 'Zaimportowano.'
                          ? 'is-success'
                          : 'is-error'
                      }`}
                    >
                      {statusMessage}
                    </p>
                  )}

                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() =>
                      setEditingCandidateId(isEditing ? null : candidate.ticketmasterId)
                    }
                  >
                    {isEditing ? 'Zamknij edycję' : 'Edytuj'}
                  </button>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => rejectCandidate(candidate.ticketmasterId)}
                  >
                    Odrzuć
                  </button>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => void importCandidate(candidate)}
                    disabled={isImported || pendingImportId === candidate.ticketmasterId}
                  >
                    {pendingImportId === candidate.ticketmasterId ? 'Importowanie...' : 'Akceptuj'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
