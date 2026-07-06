import { useState } from 'react'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { EventForm } from './EventForm'

type AdminEventsSectionProps = {
  events: EventTimesEvent[]
  venues: Venue[]
  onAddEvent: (event: EventTimesEvent) => void
  onUpdateEvent: (event: EventTimesEvent) => void
  onDeleteEvent: (eventId: string) => boolean
}

const listDateFormatter = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function AdminEventsSection({
  events,
  venues,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}: AdminEventsSectionProps) {
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const editingEvent = events.find((event) => event.id === editingEventId)

  function resetForm() {
    setEditingEventId(null)
    setSuccessMessage('')
  }

  function startEditing(event: EventTimesEvent) {
    setEditingEventId(event.id)
    setSuccessMessage('')
  }

  function removeEvent(eventId: string) {
    if (onDeleteEvent(eventId) && editingEventId === eventId) {
      resetForm()
    }
  }

  function saveEventFromForm(event: EventTimesEvent) {
    if (editingEventId) {
      onUpdateEvent(event)
      setSuccessMessage(`Zapisano zmiany: ${event.name}`)
    } else {
      onAddEvent(event)
      setSuccessMessage(`Dodano wydarzenie: ${event.name}`)
    }

    setEditingEventId(null)
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
                    <button
                      className="admin-list-delete"
                      type="button"
                      onClick={() => removeEvent(event.id)}
                    >
                      Usuń
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="empty-state admin-empty-state">
            <strong>Brak wydarzeń</strong>
            <p>Dodaj pierwsze wydarzenie za pomocą formularza poniżej.</p>
          </div>
        )}
      </section>

      <section className="admin-section" aria-labelledby="event-form-title">
        <h2 id="event-form-title">
          {editingEventId ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie'}
        </h2>
        {successMessage && (
          <p className="admin-form-message admin-form-success">{successMessage}</p>
        )}
        <EventForm
          key={editingEventId ?? 'new-event'}
          venues={venues}
          initialEvent={editingEvent}
          onSave={saveEventFromForm}
          onCancel={editingEventId ? resetForm : undefined}
        />
      </section>
    </div>
  )
}
