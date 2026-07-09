import { useState } from 'react'
import type { FormEvent } from 'react'
import { EVENT_TYPES } from '../data/searchFilters'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { hasExplicitEventTime } from '../utils/eventStatus'
import { getVenueDisplayName } from '../utils/venueDisplay'

type EventFormProps = {
  venues: Venue[]
  initialEvent?: EventTimesEvent
  lockedVenueId?: string
  isDuplicate?: boolean
  onSave: (event: EventTimesEvent) => void | Promise<void>
  onCancel?: () => void
}

type EventFormState = {
  name: string
  venueId: string
  eventType: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  ticketUrl: string
  sourceUrl: string
  imageUrl: string
}

const availableEventTypes = EVENT_TYPES.filter((eventType) => eventType !== 'Wszystkie')

function createEventId() {
  const uniquePart = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)
  return `event-${uniquePart}`
}

function getReusableEventFields(event?: EventTimesEvent, isDuplicate = false) {
  if (!event) {
    return {}
  }

  if (!isDuplicate) {
    return event
  }

  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...reusableFields
  } = event as EventTimesEvent & Record<string, unknown>

  return reusableFields
}

function toLocalDateAndTime(value?: string) {
  if (!value) {
    return { date: '', time: '' }
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return { date: '', time: '' }
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  const localDateTime = localDate.toISOString()

  return {
    date: localDateTime.slice(0, 10),
    time: hasExplicitEventTime(value) ? localDateTime.slice(11, 16) : '',
  }
}

function createLocalDateTime(dateValue: string, timeValue: string) {
  const time = timeValue || '00:00'
  const date = new Date(`${dateValue}T${time}`)

  return Number.isNaN(date.getTime()) ? null : date
}

function toStoredEventDate(date: Date, dateValue: string, timeValue: string) {
  return timeValue ? date.toISOString() : dateValue
}

function createFormState(
  venues: Venue[],
  event?: EventTimesEvent,
  lockedVenueId?: string,
): EventFormState {
  const start = toLocalDateAndTime(event?.startDate)
  const end = toLocalDateAndTime(event?.endDate)

  return event
    ? {
        name: event.name,
        venueId: lockedVenueId ?? event.venueId,
        eventType: event.eventType,
        description: event.description ?? '',
        startDate: start.date,
        startTime: start.time,
        endDate: end.date,
        endTime: end.time,
        ticketUrl: event.ticketUrl ?? '',
        sourceUrl: event.sourceUrl ?? '',
        imageUrl: event.imageUrl ?? '',
      }
    : {
        name: '',
        venueId: lockedVenueId ?? venues[0]?.id ?? '',
        eventType: 'Inne',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        ticketUrl: '',
        sourceUrl: '',
        imageUrl: '',
      }
}

export function EventForm({
  venues,
  initialEvent,
  lockedVenueId,
  isDuplicate = false,
  onSave,
  onCancel,
}: EventFormProps) {
  const [form, setForm] = useState<EventFormState>(() =>
    createFormState(venues, initialEvent, lockedVenueId),
  )
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lockedVenue = lockedVenueId
    ? venues.find((venue) => venue.id === lockedVenueId)
    : undefined

  function updateField(field: keyof EventFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setFormError('')
  }

  function clearTimeField(field: 'startTime' | 'endTime') {
    updateField(field, '')
  }

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()

    if (!form.name.trim()) {
      setFormError('Podaj nazwÄ™ wydarzenia.')
      return
    }

    if (!venues.some((venue) => venue.id === form.venueId)) {
      setFormError('Wybierz miejsce wydarzenia.')
      return
    }

    if (!form.eventType.trim()) {
      setFormError('Wybierz typ wydarzenia.')
      return
    }

    const startDate = createLocalDateTime(form.startDate, form.startTime)
    const endDate = form.endDate
      ? createLocalDateTime(form.endDate, form.endTime)
      : null

    if (!startDate) {
      setFormError('Podaj poprawnÄ… datÄ™ rozpoczÄ™cia.')
      return
    }

    if (form.endTime && !form.endDate) {
      setFormError('Podaj datÄ™ koĹ„ca albo usuĹ„ godzinÄ™ koĹ„ca.')
      return
    }

    if (endDate && endDate < startDate) {
      setFormError('Data koĹ„ca nie moĹĽe byÄ‡ wczeĹ›niejsza niĹĽ data startu.')
      return
    }

    const event: EventTimesEvent = {
      ...getReusableEventFields(initialEvent, isDuplicate),
      id: initialEvent && !isDuplicate ? initialEvent.id : createEventId(),
      venueId: form.venueId,
      name: form.name.trim(),
      eventType: form.eventType,
      description: form.description.trim(),
      startDate: toStoredEventDate(startDate, form.startDate, form.startTime),
      endDate: endDate
        ? toStoredEventDate(endDate, form.endDate, form.endTime)
        : undefined,
      ticketUrl: form.ticketUrl.trim() || undefined,
      sourceUrl: form.sourceUrl.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
    }

    try {
      setIsSubmitting(true)
      await onSave(event)

      if (!initialEvent || isDuplicate) {
        setForm(createFormState(venues, undefined, lockedVenueId))
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Nie udaĹ‚o siÄ™ zapisaÄ‡ wydarzenia.',
      )
    } finally {
      setIsSubmitting(false)
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

      {lockedVenue ? (
        <label>
          <span>Miejsce</span>
          <input value={getVenueDisplayName(lockedVenue)} readOnly />
        </label>
      ) : (
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
                {getVenueDisplayName(venue)}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        <span>Typ wydarzenia</span>
        <select
          required
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
          rows={4}
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
        />
      </label>

      <label>
        <span>Data startu</span>
        <input
          required
          type="date"
          value={form.startDate}
          onChange={(event) => updateField('startDate', event.target.value)}
        />
      </label>

      <label>
        <span>Godzina startu</span>
        <div className="admin-time-field">
          <input
            type="time"
            value={form.startTime}
            onChange={(event) => updateField('startTime', event.target.value)}
          />
          <button
            type="button"
            onClick={() => clearTimeField('startTime')}
            disabled={!form.startTime}
          >
            Bez godziny
          </button>
        </div>
      </label>

      <label>
        <span>Data koĹ„ca</span>
        <input
          type="date"
          value={form.endDate}
          onChange={(event) => updateField('endDate', event.target.value)}
        />
      </label>

      <label>
        <span>Godzina koĹ„ca</span>
        <div className="admin-time-field">
          <input
            type="time"
            value={form.endTime}
            onChange={(event) => updateField('endTime', event.target.value)}
          />
          <button
            type="button"
            onClick={() => clearTimeField('endTime')}
            disabled={!form.endTime}
          >
            Bez godziny
          </button>
        </div>
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
        <span>Link do ĹşrĂłdĹ‚a</span>
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
        <button
          className="button button-primary"
          type="submit"
          disabled={!venues.length || isSubmitting}
        >
          {isSubmitting
            ? 'Zapisywanie...'
            : isDuplicate
              ? 'Zapisz jako nowe wydarzenie'
              : 'Zapisz'}
        </button>
        {onCancel && (
          <button
            className="button button-secondary"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Anuluj
          </button>
        )}
      </div>
    </form>
  )
}
