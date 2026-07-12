import { useState } from 'react'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { formatEventDate } from '../utils/eventStatus'
import { getVenueDisplayName } from '../utils/venueDisplay'
import { EventForm } from './EventForm'

type AdminEventsSectionProps = {
  events: EventTimesEvent[]
  venues: Venue[]
  onAddEvent: (event: EventTimesEvent) => void | Promise<void>
  onUpdateEvent: (event: EventTimesEvent) => void | Promise<void>
  onDeleteEvent: (eventId: string) => boolean | Promise<boolean>
}

export function AdminEventsSection({
  events,
  venues,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}: AdminEventsSectionProps) {
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [duplicatingEventId, setDuplicatingEventId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [pendingEventAction, setPendingEventAction] = useState<string | null>(null)
  const editingEvent = events.find((event) => event.id === editingEventId)
  const duplicatingEvent = events.find((event) => event.id === duplicatingEventId)

  function resetForm() {
    setEditingEventId(null)
    setDuplicatingEventId(null)
    setSuccessMessage('')
  }

  function startEditing(event: EventTimesEvent) {
    setEditingEventId(event.id)
    setDuplicatingEventId(null)
    setSuccessMessage('')
  }

  function startDuplicating(event: EventTimesEvent) {
    setDuplicatingEventId(event.id)
    setEditingEventId(null)
    setSuccessMessage('')
  }

  async function removeEvent(eventId: string) {
    setPendingEventAction(`delete-${eventId}`)
    const wasDeleted = await onDeleteEvent(eventId)
    setPendingEventAction(null)

    if (wasDeleted && editingEventId === eventId) {
      resetForm()
    }
  }

  async function saveEventFromForm(event: EventTimesEvent) {
    setPendingEventAction(editingEventId ? `save-${editingEventId}` : 'save-new')

    try {
      if (editingEventId) {
        await onUpdateEvent(event)
        setSuccessMessage('Zaktualizowano wydarzenie.')
      } else {
        await onAddEvent(event)
        setSuccessMessage('Zapisano wydarzenie.')
      }

      setEditingEventId(null)
      setDuplicatingEventId(null)
    } finally {
      setPendingEventAction(null)
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
                    {event.eventType} · {venue ? getVenueDisplayName(venue) : 'Nieznane miejsce'}
                  </span>
                  <small>{formatEventDate(event.startDate)}</small>
                  <div className="admin-venue-actions">
                    <button
                      type="button"
                      onClick={() => startEditing(event)}
                      disabled={pendingEventAction !== null}
                    >
                      Edytuj
                    </button>
                    <button
                      type="button"
                      onClick={() => startDuplicating(event)}
                      disabled={pendingEventAction !== null}
                    >
                      Duplikuj
                    </button>
                    <button
                      className="admin-list-delete"
                      type="button"
                      onClick={() => void removeEvent(event.id)}
                      disabled={pendingEventAction !== null}
                    >
                      {pendingEventAction === `delete-${event.id}` ? 'Usuwanie...' : 'Usuń'}
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
          {editingEventId
            ? 'Edytuj wydarzenie'
            : duplicatingEventId
              ? 'Duplikuj wydarzenie'
              : 'Dodaj wydarzenie'}
        </h2>
        {duplicatingEventId && (
          <p className="admin-form-hint">
            Zmień datę, godzinę lub inne dane i zapisz jako nowe wydarzenie.
          </p>
        )}
        {successMessage && (
          <p className="admin-form-message admin-form-success">{successMessage}</p>
        )}
        <EventForm
          key={
            editingEventId
              ? `edit-${editingEventId}`
              : duplicatingEventId
                ? `duplicate-${duplicatingEventId}`
                : 'new-event'
          }
          venues={venues}
          initialEvent={editingEvent ?? duplicatingEvent}
          isDuplicate={Boolean(duplicatingEventId)}
          onSave={saveEventFromForm}
          onCancel={editingEventId || duplicatingEventId ? resetForm : undefined}
        />
      </section>
    </div>
  )
}
