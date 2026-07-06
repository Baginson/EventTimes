import { useState } from 'react'
import type { FormEvent } from 'react'
import { EVENT_TYPES } from '../data/searchFilters'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'

type EventFormProps = {
  venues: Venue[]
  initialEvent?: EventTimesEvent
  onSave: (event: EventTimesEvent) => void
  onCancel?: () => void
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

function createFormState(venues: Venue[], event?: EventTimesEvent): EventFormState {
  return event
    ? {
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
    : {
        name: '',
        venueId: venues[0]?.id ?? '',
        eventType: 'Inne',
        description: '',
        startDate: '',
        endDate: '',
        ticketUrl: '',
        sourceUrl: '',
        imageUrl: '',
      }
}

export function EventForm({ venues, initialEvent, onSave, onCancel }: EventFormProps) {
  const [form, setForm] = useState<EventFormState>(() =>
    createFormState(venues, initialEvent),
  )
  const [formError, setFormError] = useState('')

  function updateField(field: keyof EventFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setFormError('')
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
      id: initialEvent?.id ?? createEventId(),
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
      onSave(event)

      if (!initialEvent) {
        setForm(createFormState(venues))
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Nie udało się zapisać wydarzenia.',
      )
    }
  }

  return (
    <form className="admin-form context-form" onSubmit={handleSubmit}>
      <label>
        <span>Nazwa wydarzenia</span>
        <input
          required
          autoFocus
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

      {formError && (
        <p className="admin-form-message admin-form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="admin-form-actions">
        <button className="button button-primary" type="submit" disabled={!venues.length}>
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
