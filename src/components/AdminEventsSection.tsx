import { useState } from 'react'
import type { FormEvent } from 'react'
import { EVENT_TYPES } from '../data/searchFilters'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'

type AdminEventsSectionProps = {
  events: EventTimesEvent[]
  venues: Venue[]
  onAddEvent: (event: EventTimesEvent) => void
  onUpdateEvent: (event: EventTimesEvent) => void
}

type EventFormState = {
  name: string
  venueId: string
  eventType: string
  description: string
  startDate: string
  endDate: string
  ticketUrl: string
  sourceUrl: string
  imageUrl: string
}

const availableEventTypes = EVENT_TYPES.filter((eventType) => eventType !== 'Wszystkie')

const listDateFormatter = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function createInitialForm(venueId = ''): EventFormState {
  return {
    name: '',
    venueId,
    eventType: 'Inne',
    description: '',
    startDate: '',
    endDate: '',
    ticketUrl: '',
    sourceUrl: '',
    imageUrl: '',
  }
}

function createEventId() {
  const uniquePart = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)
  return `event-${uniquePart}`
}

function toDateTimeLocal(value?: string) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function eventToForm(event: EventTimesEvent): EventFormState {
  return {
    name: event.name,
    venueId: event.venueId,
    eventType: event.eventType,
    description: event.description,
    startDate: toDateTimeLocal(event.startDate),
    endDate: toDateTimeLocal(event.endDate),
    ticketUrl: event.ticketUrl ?? '',
    sourceUrl: event.sourceUrl ?? '',
    imageUrl: event.imageUrl ?? '',
  }
}

export function AdminEventsSection({
  events,
  venues,
  onAddEvent,
  onUpdateEvent,
}: AdminEventsSectionProps) {
  const [form, setForm] = useState<EventFormState>(() =>
    createInitialForm(venues[0]?.id),
  )
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  function updateField(field: keyof EventFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setFormError('')
    setSuccessMessage('')
  }

  function resetForm() {
    setEditingEventId(null)
    setForm(createInitialForm(venues[0]?.id))
    setFormError('')
    setSuccessMessage('')
  }

  function startEditing(event: EventTimesEvent) {
    setEditingEventId(event.id)
    setForm(eventToForm(event))
    setFormError('')
    setSuccessMessage('')
  }

  function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()

    if (!venues.some((venue) => venue.id === form.venueId)) {
      setFormError('Wybierz miejsce wydarzenia.')
      return
    }

    const startDate = new Date(form.startDate)
    const endDate = form.endDate ? new Date(form.endDate) : null

    if (Number.isNaN(startDate.getTime())) {
      setFormError('Podaj poprawną datę rozpoczęcia.')
      return
    }

    if (endDate && (Number.isNaN(endDate.getTime()) || endDate < startDate)) {
      setFormError('Data końca nie może być wcześniejsza niż data startu.')
      return
    }

    const event: EventTimesEvent = {
      id: editingEventId ?? createEventId(),
      venueId: form.venueId,
      name: form.name.trim(),
      eventType: form.eventType,
      description: form.description.trim(),
      startDate: startDate.toISOString(),
      endDate: endDate?.toISOString(),
      ticketUrl: form.ticketUrl.trim() || undefined,
      sourceUrl: form.sourceUrl.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
    }

    try {
      if (editingEventId) {
        onUpdateEvent(event)
        setSuccessMessage(`Zapisano zmiany: ${event.name}`)
      } else {
        onAddEvent(event)
        setSuccessMessage(`Dodano wydarzenie: ${event.name}`)
      }

      setEditingEventId(null)
      setForm(createInitialForm(venues[0]?.id))
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Nie udało się zapisać wydarzenia.',
      )
    }
  }

  return (
    <div className="admin-events-view">
      <section className="admin-section" aria-labelledby="admin-events-title">
        <div className="admin-section-heading">
          <h2 id="admin-events-title">Wydarzenia</h2>
          <span>{events.length}</span>
        </div>

        {events.length > 0 ? (
          <ul className="admin-event-list">
            {events.map((event) => {
            const venue = venues.find((candidate) => candidate.id === event.venueId)

            return (
              <li key={event.id}>
                <strong>{event.name}</strong>
                <span>
                  {event.eventType} · {venue?.name ?? 'Nieznane miejsce'}
                </span>
                <small>{listDateFormatter.format(new Date(event.startDate))}</small>
                <div className="admin-venue-actions">
                  <button type="button" onClick={() => startEditing(event)}>
                    Edytuj
                  </button>
                </div>
              </li>
            )
            })}
          </ul>
        ) : (
          <div className="empty-state admin-empty-state">
            <strong>Brak wydarzeń</strong>
            <p>Dodaj pierwszy event za pomocą formularza poniżej.</p>
          </div>
        )}
      </section>

      <section className="admin-section" aria-labelledby="event-form-title">
        <h2 id="event-form-title">
          {editingEventId ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie'}
        </h2>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            <span>Nazwa wydarzenia</span>
            <input
              required
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
            />
          </label>

          <label>
            <span>Miejsce</span>
            <select
              required
              value={form.venueId}
              onChange={(event) => updateField('venueId', event.target.value)}
            >
              <option value="" disabled>
                Wybierz miejsce
              </option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Typ wydarzenia</span>
            <select
              value={form.eventType}
              onChange={(event) => updateField('eventType', event.target.value)}
            >
              {availableEventTypes.map((eventType) => (
                <option key={eventType} value={eventType}>
                  {eventType}
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
            <span>Data startu</span>
            <input
              required
              type="datetime-local"
              value={form.startDate}
              onChange={(event) => updateField('startDate', event.target.value)}
            />
          </label>

          <label>
            <span>Data końca</span>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(event) => updateField('endDate', event.target.value)}
            />
          </label>

          <label className="admin-form-wide">
            <span>Link do biletu</span>
            <input
              type="url"
              placeholder="https://"
              value={form.ticketUrl}
              onChange={(event) => updateField('ticketUrl', event.target.value)}
            />
          </label>

          <label className="admin-form-wide">
            <span>Link do źródła</span>
            <input
              type="url"
              placeholder="https://"
              value={form.sourceUrl}
              onChange={(event) => updateField('sourceUrl', event.target.value)}
            />
          </label>

          <label className="admin-form-wide">
            <span>Image URL (opcjonalnie)</span>
            <input
              type="url"
              placeholder="https://"
              value={form.imageUrl}
              onChange={(event) => updateField('imageUrl', event.target.value)}
            />
          </label>

          {formError && <p className="admin-form-message admin-form-error">{formError}</p>}
          {successMessage && (
            <p className="admin-form-message admin-form-success">{successMessage}</p>
          )}

          <div className="admin-form-actions">
            <button className="button button-primary" type="submit" disabled={!venues.length}>
              {editingEventId ? 'Zapisz zmiany' : 'Dodaj wydarzenie'}
            </button>
            {editingEventId && (
              <button className="button button-secondary" type="button" onClick={resetForm}>
                Anuluj edycję
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
