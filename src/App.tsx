import { useEffect, useRef, useState } from 'react'
import { useAuth } from './auth/authContext'
import { AccountPanel } from './components/AccountPanel'
import { AuthModal } from './components/AuthModal'
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
  replaceEventsInFirestore,
  saveEvent,
  updateEvent as persistEventUpdate,
} from './services/eventService'
import type { LocalBackupData } from './services/localBackupService'
import {
  clearStoredVenues,
  deleteVenue as persistVenueDelete,
  getVenues,
  replaceVenues,
  replaceVenuesInFirestore,
  saveVenue,
  updateVenue as persistVenueUpdate,
} from './services/venueService'
import './App.css'

type MapMode =
  | { type: 'normal' }
  | { type: 'addingVenue' }
  | { type: 'movingVenue'; venueId: string }

function App() {
  const { isAdmin, user } = useAuth()
  const [venues, setVenues] = useState<Venue[]>([])
  const [events, setEvents] = useState<EventTimesEvent[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventTimesEvent | null>(null)
  const [selectedCity, setSelectedCity] = useState('Leszno')
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [mapMode, setMapMode] = useState<MapMode>({ type: 'normal' })
  const [draftVenueCoordinates, setDraftVenueCoordinates] =
    useState<Venue['coordinates'] | null>(null)
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false)
  const rightPanelRef = useRef<HTMLElement>(null)
  const movingVenueId = mapMode.type === 'movingVenue' ? mapMode.venueId : null
  const isAddingVenue = mapMode.type === 'addingVenue'
  const isRightPanelOpen = Boolean(
    selectedVenue && !isAdminOpen && !isAccountPanelOpen,
  )

  useEffect(() => {
    let active = true

    async function loadPublicData() {
      setDataLoading(true)
      setDataError('')

      try {
        const [loadedVenues, loadedEvents] = await Promise.all([
          getVenues(),
          getEvents(),
        ])

        if (!active) {
          return
        }

        setVenues(loadedVenues)
        setEvents(loadedEvents)

        setSelectedCity((currentCity) =>
          loadedVenues.length > 0 &&
          !loadedVenues.some((venue) => venue.city === currentCity)
            ? loadedVenues[0]?.city ?? 'Leszno'
            : currentCity,
        )
      } catch (error) {
        if (active) {
          setDataError(
            error instanceof Error
              ? error.message
              : 'Nie udało się pobrać danych publicznych.',
          )
        }
      } finally {
        if (active) {
          setDataLoading(false)
        }
      }
    }

    void loadPublicData()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (selectedVenue) {
      const updatedVenue = venues.find((venue) => venue.id === selectedVenue.id)
      setSelectedVenue(updatedVenue ?? null)
    }

    if (selectedEvent) {
      const updatedEvent = events.find((event) => event.id === selectedEvent.id)
      setSelectedEvent(updatedEvent ?? null)
    }
  }, [events, selectedEvent, selectedVenue, venues])

  useEffect(() => {
    if (!isAdmin) {
      setIsAdminMode(false)
      setIsAdminOpen(false)
      cancelMapMode()
    }
  }, [isAdmin])

  useEffect(() => {
    if (!user) {
      setIsAccountPanelOpen(false)
    }
  }, [user])

  useEffect(() => {
    if (!isRightPanelOpen) {
      return
    }

    function handleOutsideRightPanelClick(event: PointerEvent) {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (rightPanelRef.current?.contains(target)) {
        return
      }

      if (
        target instanceof Element &&
        (target.closest('.top-bar') || target.closest('.leaflet-marker-icon'))
      ) {
        return
      }

      closePanel()
    }

    document.addEventListener('pointerdown', handleOutsideRightPanelClick)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideRightPanelClick)
    }
  }, [isRightPanelOpen])

  const visibleVenues = venues.filter((venue) => venue.city === selectedCity)

  const selectedVenueEvents = selectedVenue
    ? events.filter((event) => event.venueId === selectedVenue.id)
    : []

  function selectVenue(venue: Venue) {
    setIsAdminOpen(false)
    setIsAccountPanelOpen(false)
    cancelMapMode()
    setSelectedVenue(venue)
    setSelectedEvent(null)
  }

  function selectEvent(event: EventTimesEvent, venue: Venue) {
    setIsAdminOpen(false)
    setIsAccountPanelOpen(false)
    cancelMapMode()
    setSelectedVenue(venue)
    setSelectedEvent(event)
  }

  function closePanel() {
    setSelectedVenue(null)
    setSelectedEvent(null)
  }

  function toggleAdminPanel() {
    if (!isAdmin) {
      return
    }

    if (isAdminOpen) {
      closeAdminDrawer()
      return
    }

    setIsAdminMode(true)
    setIsAdminOpen(true)
    cancelMapMode()
    setIsAccountPanelOpen(false)
    closePanel()
  }

  function closeAdminDrawer() {
    setIsAdminOpen(false)
  }

  function disableAdminMode() {
    setIsAdminMode(false)
    setIsAdminOpen(false)
    cancelMapMode()
  }

  async function addVenue(venue: Venue) {
    const nextVenues = await saveVenue(venue)
    setVenues(nextVenues)
    cancelMapMode()
    setSelectedVenue(venue)
    setSelectedEvent(null)
  }

  async function updateVenue(venue: Venue) {
    const nextVenues = await persistVenueUpdate(venue)
    setVenues(nextVenues)

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

    void Promise.all([
      deleteEventsByVenueId(venueId),
      persistVenueDelete(venueId),
    ])
      .then(([nextEvents, nextVenues]) => {
        setEvents(nextEvents)
        setVenues(nextVenues)
      })
      .catch((error) => {
        window.alert(
          error instanceof Error
            ? error.message
            : 'Nie udało się usunąć miejsca.',
        )
      })

    if (selectedVenue?.id === venueId) {
      closePanel()
    }

    if (movingVenueId === venueId) {
      cancelMapMode()
    }

    return true
  }

  function handleMapClick(coordinates: Venue['coordinates']) {
    if (mapMode.type === 'addingVenue') {
      setDraftVenueCoordinates(coordinates)
      setIsAdminMode(true)
      setIsAdminOpen(true)
      closePanel()
      return
    }

    if (mapMode.type === 'movingVenue') {
      const venue = venues.find((candidate) => candidate.id === mapMode.venueId)

      if (!venue) {
        cancelMapMode()
        return
      }

      void updateVenue({ ...venue, coordinates }).catch((error) => {
        window.alert(
          error instanceof Error
            ? error.message
            : 'Nie udało się przesunąć pinezki.',
        )
      })
      cancelMapMode()
    }
  }

  async function addEvent(event: EventTimesEvent) {
    const nextEvents = await saveEvent(event)
    setEvents(nextEvents)
  }

  async function addEventAndSelect(event: EventTimesEvent) {
    const nextEvents = await saveEvent(event)
    setEvents(nextEvents)

    const eventVenue = venues.find((venue) => venue.id === event.venueId)

    if (eventVenue) {
      setSelectedVenue(eventVenue)
      setSelectedEvent(event)
    }
  }

  async function updateEvent(event: EventTimesEvent) {
    const nextEvents = await persistEventUpdate(event)
    setEvents(nextEvents)

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

    void persistEventDelete(eventId)
      .then(setEvents)
      .catch((error) => {
        window.alert(
          error instanceof Error
            ? error.message
            : 'Nie udało się usunąć wydarzenia.',
        )
      })

    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null)
    }

    return true
  }

  function startMovingVenue(venueId: string) {
    if (!isAdmin) {
      return
    }

    setIsAdminMode(true)
    setIsAdminOpen(false)
    setDraftVenueCoordinates(null)
    setMapMode({ type: 'movingVenue', venueId })
  }

  function startAddingVenue() {
    if (!isAdmin) {
      return
    }

    setIsAdminMode(true)
    setIsAdminOpen(true)
    setDraftVenueCoordinates(null)
    setSelectedVenue(null)
    setSelectedEvent(null)
    setMapMode({ type: 'addingVenue' })
  }

  function setDraftVenueFromGoogleMapsLink(coordinates: Venue['coordinates']) {
    if (!isAdmin) {
      return
    }

    setIsAdminMode(true)
    setIsAdminOpen(true)
    setSelectedVenue(null)
    setSelectedEvent(null)
    setDraftVenueCoordinates(coordinates)
    setMapMode({ type: 'addingVenue' })
  }

  function adjustDraftVenuePin() {
    if (!isAdmin) {
      return
    }

    setIsAdminMode(true)
    setIsAdminOpen(true)
    closePanel()
    setMapMode({ type: 'addingVenue' })
  }

  function cancelMapMode() {
    setMapMode({ type: 'normal' })
    setDraftVenueCoordinates(null)
  }

  function importLocalData(backup: LocalBackupData) {
    const importedVenues = replaceVenues(backup.venues)
    const importedEvents = replaceEvents(backup.events)
    setVenues(importedVenues)
    setEvents(importedEvents)
    cancelMapMode()
    closePanel()

    if (!importedVenues.some((venue) => venue.city === selectedCity)) {
      setSelectedCity(importedVenues[0]?.city ?? 'Leszno')
    }
  }

  async function importFirestoreData(backup: LocalBackupData) {
    await replaceVenuesInFirestore(backup.venues)
    await replaceEventsInFirestore(backup.events)
    setVenues(await getVenues())
    setEvents(await getEvents())
    cancelMapMode()
    closePanel()

    if (!backup.venues.some((venue) => venue.city === selectedCity)) {
      setSelectedCity(backup.venues[0]?.city ?? 'Leszno')
    }
  }

  async function moveCurrentDataToFirestore() {
    await replaceVenuesInFirestore(venues)
    await replaceEventsInFirestore(events)
    setVenues(await getVenues())
    setEvents(await getEvents())
  }

  function restoreStarterData() {
    setVenues(clearStoredVenues())
    setEvents(clearStoredEvents())
    setSelectedCity('Leszno')
    cancelMapMode()
    closePanel()
  }

  return (
    <div className="app-shell" lang="pl">
      <AuthModal />
      <TopBar
        selectedCity={selectedCity}
        venues={venues}
        events={events}
        isAdminMode={isAdminMode}
        isAdmin={isAdmin}
        isRightPanelOpen={isRightPanelOpen}
        onCityChange={setSelectedCity}
        onVenueSelect={selectVenue}
        onEventSelect={selectEvent}
        onAdminToggle={toggleAdminPanel}
        onOpenProfile={() => {
          closePanel()
          setIsAdminOpen(false)
          setIsAccountPanelOpen(true)
        }}
      />

      <main className="map-workspace">
        {dataError && (
          <div className="map-move-notice map-error-notice" role="alert">
            <span>{dataError}</span>
          </div>
        )}
        {dataLoading && (
          <div className="map-move-notice" role="status">
            <span>Ładowanie danych Event Times…</span>
          </div>
        )}
        {!dataLoading && !dataError && isAdmin && venues.length === 0 && events.length === 0 && (
          <div className="map-move-notice" role="status">
            <span>Baza Firestore jest pusta. Otwórz Panel admina i zaimportuj JSON do Firestore.</span>
          </div>
        )}

        <EventMap
          venues={visibleVenues}
          selectedVenueId={selectedVenue?.id ?? null}
          isMapClickActive={mapMode.type !== 'normal'}
          temporaryVenueCoordinates={draftVenueCoordinates}
          focusCoordinates={draftVenueCoordinates}
          onVenueSelect={selectVenue}
          onMapClick={handleMapClick}
        />

        {mapMode.type !== 'normal' && (
          <div className="map-move-notice" role="status">
            <span>
              {mapMode.type === 'addingVenue'
                ? draftVenueCoordinates
                  ? 'Uzupełnij formularz miejsca albo kliknij inne miejsce na mapie.'
                  : 'Kliknij na mapie, aby ustawić pinezkę nowego miejsca.'
                : 'Kliknij nowe miejsce na mapie, aby przesunąć pinezkę.'}
            </span>
            <button type="button" onClick={cancelMapMode}>
              Anuluj
            </button>
          </div>
        )}

        {isAdmin && isAdminOpen && (
          <AdminPanel
            venues={venues}
            events={events}
            movingVenueId={movingVenueId}
            isAddingVenue={isAddingVenue}
            draftVenueCoordinates={draftVenueCoordinates}
            onAddVenue={addVenue}
            onUpdateVenue={updateVenue}
            onDeleteVenue={deleteVenue}
            onAddEvent={addEvent}
            onUpdateEvent={updateEvent}
            onDeleteEvent={deleteEvent}
            onImportData={importLocalData}
            onImportFirestoreData={importFirestoreData}
            onMoveCurrentDataToFirestore={moveCurrentDataToFirestore}
            onResetData={restoreStarterData}
            onClearData={restoreStarterData}
            onStartVenueAdd={startAddingVenue}
            onSetDraftVenueCoordinates={setDraftVenueFromGoogleMapsLink}
            onAdjustTemporaryPin={adjustDraftVenuePin}
            onStartPinMove={startMovingVenue}
            onCancelMapMode={cancelMapMode}
            onDisableAdminMode={disableAdminMode}
            onClose={closeAdminDrawer}
          />
        )}

        {isAccountPanelOpen && (
          <AccountPanel
            venues={venues}
            events={events}
            onVenueSelect={selectVenue}
            onEventSelect={selectEvent}
            onClose={() => setIsAccountPanelOpen(false)}
          />
        )}

        {!isAdminOpen && !isAccountPanelOpen && selectedVenue && selectedEvent ? (
          <EventPanel
            event={selectedEvent}
            venue={selectedVenue}
            venues={venues}
            isAdminMode={isAdmin && isAdminMode}
            onBack={() => setSelectedEvent(null)}
            onAddEvent={addEventAndSelect}
            onUpdateEvent={updateEvent}
            onDeleteEvent={() => deleteEvent(selectedEvent.id)}
            onClose={closePanel}
            panelRef={rightPanelRef}
          />
        ) : !isAdminOpen && !isAccountPanelOpen && selectedVenue ? (
          <VenuePanel
            venue={selectedVenue}
            events={selectedVenueEvents}
            isAdminMode={isAdmin && isAdminMode}
            isPinMoveActive={movingVenueId === selectedVenue.id}
            onEventSelect={(event) => selectEvent(event, selectedVenue)}
            venues={venues}
            onAddEvent={addEvent}
            onUpdateVenue={updateVenue}
            onDeleteVenue={() => deleteVenue(selectedVenue.id)}
            onMoveVenue={() => startMovingVenue(selectedVenue.id)}
            onClose={closePanel}
            panelRef={rightPanelRef}
          />
        ) : null}
      </main>
    </div>
  )
}

export default App
