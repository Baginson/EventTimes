import { useState } from 'react'
import { AdminPanel } from './components/AdminPanel'
import { EventMap } from './components/EventMap'
import { EventPanel } from './components/EventPanel'
import { TopBar } from './components/TopBar'
import { VenuePanel } from './components/VenuePanel'
import type { EventTimesEvent } from './data/mockEvents'
import type { Venue } from './data/mockVenues'
import {
  clearStoredEvents,
  deleteEvent as persistEventDelete,
  deleteEventsByVenueId,
  getEvents,
  replaceEvents,
  saveEvent,
  updateEvent as persistEventUpdate,
} from './services/eventService'
import type { LocalBackupData } from './services/localBackupService'
import {
  clearStoredVenues,
  deleteVenue as persistVenueDelete,
  getVenues,
  replaceVenues,
  saveVenue,
  updateVenue as persistVenueUpdate,
} from './services/venueService'
import './App.css'

function App() {
  const [venues, setVenues] = useState<Venue[]>(() => getVenues())
  const [events, setEvents] = useState<EventTimesEvent[]>(() => getEvents())
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventTimesEvent | null>(null)
  const [selectedCity, setSelectedCity] = useState('Leszno')
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [movingVenueId, setMovingVenueId] = useState<string | null>(null)

  const visibleVenues = venues.filter((venue) => venue.city === selectedCity)

  const selectedVenueEvents = selectedVenue
    ? events.filter((event) => event.venueId === selectedVenue.id)
    : []

  function selectVenue(venue: Venue) {
    setIsAdminOpen(false)
    setMovingVenueId(null)
    setSelectedVenue(venue)
    setSelectedEvent(null)
  }

  function selectEvent(event: EventTimesEvent, venue: Venue) {
    setIsAdminOpen(false)
    setMovingVenueId(null)
    setSelectedVenue(venue)
    setSelectedEvent(event)
  }

  function closePanel() {
    setSelectedVenue(null)
    setSelectedEvent(null)
  }

  function toggleAdminPanel() {
    if (isAdminOpen) {
      closeAdminDrawer()
      return
    }

    setIsAdminMode(true)
    setIsAdminOpen(true)
    setMovingVenueId(null)
    closePanel()
  }

  function closeAdminDrawer() {
    setIsAdminOpen(false)
  }

  function disableAdminMode() {
    setIsAdminMode(false)
    setIsAdminOpen(false)
    setMovingVenueId(null)
  }

  function addVenue(venue: Venue) {
    setVenues(saveVenue(venue))
  }

  function updateVenue(venue: Venue) {
    setVenues(persistVenueUpdate(venue))

    if (selectedVenue?.id === venue.id) {
      setSelectedVenue(venue)
    }
  }

  function deleteVenue(venueId: string) {
    const confirmed = window.confirm(
      'Czy na pewno chcesz usunąć to miejsce? Usunięte zostaną także wydarzenia przypisane do tego miejsca.',
    )

    if (!confirmed) {
      return false
    }

    setEvents(deleteEventsByVenueId(venueId))
    setVenues(persistVenueDelete(venueId))

    if (selectedVenue?.id === venueId) {
      closePanel()
    }

    if (movingVenueId === venueId) {
      setMovingVenueId(null)
    }

    return true
  }

  function moveVenuePin(coordinates: Venue['coordinates']) {
    if (!movingVenueId) {
      return
    }

    const venue = venues.find((candidate) => candidate.id === movingVenueId)

    if (!venue) {
      setMovingVenueId(null)
      return
    }

    updateVenue({ ...venue, coordinates })
    setMovingVenueId(null)
  }

  function addEvent(event: EventTimesEvent) {
    setEvents(saveEvent(event))
  }

  function updateEvent(event: EventTimesEvent) {
    setEvents(persistEventUpdate(event))

    if (selectedEvent?.id === event.id) {
      setSelectedEvent(event)
      const eventVenue = venues.find((venue) => venue.id === event.venueId)

      if (eventVenue) {
        setSelectedVenue(eventVenue)
      }
    }
  }

  function deleteEvent(eventId: string) {
    const confirmed = window.confirm(
      'Czy na pewno chcesz usunąć to wydarzenie?',
    )

    if (!confirmed) {
      return false
    }

    setEvents(persistEventDelete(eventId))

    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null)
    }

    return true
  }

  function startMovingVenue(venueId: string) {
    setIsAdminMode(true)
    setIsAdminOpen(false)
    setMovingVenueId(venueId)
  }

  function importLocalData(backup: LocalBackupData) {
    const importedVenues = replaceVenues(backup.venues)
    const importedEvents = replaceEvents(backup.events)
    setVenues(importedVenues)
    setEvents(importedEvents)
    setMovingVenueId(null)
    closePanel()

    if (!importedVenues.some((venue) => venue.city === selectedCity)) {
      setSelectedCity(importedVenues[0]?.city ?? 'Leszno')
    }
  }

  function restoreStarterData() {
    setVenues(clearStoredVenues())
    setEvents(clearStoredEvents())
    setSelectedCity('Leszno')
    setMovingVenueId(null)
    closePanel()
  }

  return (
    <div className="app-shell">
      <TopBar
        selectedCity={selectedCity}
        venues={venues}
        events={events}
        isAdminMode={isAdminMode}
        onCityChange={setSelectedCity}
        onVenueSelect={selectVenue}
        onEventSelect={selectEvent}
        onAdminToggle={toggleAdminPanel}
      />

      <main className="map-workspace">
        <EventMap
          venues={visibleVenues}
          selectedVenueId={selectedVenue?.id ?? null}
          isPinMoveActive={movingVenueId !== null}
          onVenueSelect={selectVenue}
          onMapClick={moveVenuePin}
        />

        {movingVenueId && (
          <div className="map-move-notice" role="status">
            <span>Następne kliknięcie na mapie ustawi nową lokalizację pinezki.</span>
            <button type="button" onClick={() => setMovingVenueId(null)}>
              Anuluj
            </button>
          </div>
        )}

        {isAdminOpen && (
          <AdminPanel
            venues={venues}
            events={events}
            movingVenueId={movingVenueId}
            onAddVenue={addVenue}
            onUpdateVenue={updateVenue}
            onDeleteVenue={deleteVenue}
            onAddEvent={addEvent}
            onUpdateEvent={updateEvent}
            onDeleteEvent={deleteEvent}
            onImportData={importLocalData}
            onResetData={restoreStarterData}
            onClearData={restoreStarterData}
            onStartPinMove={startMovingVenue}
            onCancelPinMove={() => setMovingVenueId(null)}
            onDisableAdminMode={disableAdminMode}
            onClose={closeAdminDrawer}
          />
        )}

        {!isAdminOpen && selectedVenue && selectedEvent ? (
          <EventPanel
            event={selectedEvent}
            venue={selectedVenue}
            venues={venues}
            isAdminMode={isAdminMode}
            onBack={() => setSelectedEvent(null)}
            onUpdateEvent={updateEvent}
            onDeleteEvent={() => deleteEvent(selectedEvent.id)}
            onClose={closePanel}
          />
        ) : !isAdminOpen && selectedVenue ? (
          <VenuePanel
            venue={selectedVenue}
            events={selectedVenueEvents}
            isAdminMode={isAdminMode}
            isPinMoveActive={movingVenueId === selectedVenue.id}
            onEventSelect={(event) => selectEvent(event, selectedVenue)}
            onUpdateVenue={updateVenue}
            onDeleteVenue={() => deleteVenue(selectedVenue.id)}
            onMoveVenue={() => startMovingVenue(selectedVenue.id)}
            onClose={closePanel}
          />
        ) : null}
      </main>
    </div>
  )
}

export default App
