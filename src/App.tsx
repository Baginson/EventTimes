import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './auth/authContext'
import { AuthModal } from './components/AuthModal'
import { EventMap } from './components/EventMap'
import type { MapFocusPadding } from './components/EventMap'
import { EventPanel } from './components/EventPanel'
import { MobileBottomBar } from './components/MobileBottomBar'
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
import { hasValidVenueCoordinates } from './utils/googleMaps'
import './App.css'

const AdminPanel = lazy(() =>
  import('./components/AdminPanel').then((module) => ({ default: module.AdminPanel })),
)
const AccountPanel = lazy(() =>
  import('./components/AccountPanel').then((module) => ({ default: module.AccountPanel })),
)

type EventOrigin = 'venue' | 'profile' | 'direct'

type MapMode =
  | { type: 'normal' }
  | { type: 'addingVenue' }
  | { type: 'movingVenue'; venueId: string }

type AppToast = {
  message: string
  tone: 'success' | 'error'
}

// Ten sam breakpoint co w usePanelMotion — poniżej panel jest dolnym arkuszem.
const MOBILE_PANEL_MEDIA_QUERY = '(max-width: 820px)'

function App() {
  const { isAdmin, isAuthModalOpen, openAuthModal, user } = useAuth()
  const [venues, setVenues] = useState<Venue[]>([])
  const [events, setEvents] = useState<EventTimesEvent[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [toast, setToast] = useState<AppToast | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventTimesEvent | null>(null)
  const [selectedCity, setSelectedCity] = useState('Leszno')
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [mapMode, setMapMode] = useState<MapMode>({ type: 'normal' })
  const [draftVenueCoordinates, setDraftVenueCoordinates] =
    useState<Venue['coordinates'] | null>(null)
  const [venueFocusCoordinates, setVenueFocusCoordinates] =
    useState<Venue['coordinates'] | null>(null)
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false)
  const [eventOrigin, setEventOrigin] = useState<EventOrigin>('direct')
  const [mobileSearchFocusRequest, setMobileSearchFocusRequest] = useState(0)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const rightPanelRef = useRef<HTMLElement | null>(null)
  const hasConsumedShareParamsRef = useRef(false)
  const movingVenueId = mapMode.type === 'movingVenue' ? mapMode.venueId : null
  const isAddingVenue = mapMode.type === 'addingVenue'
  const isRightPanelOpen = Boolean(
    selectedVenue && !isAdminOpen && !isAccountPanelOpen,
  )

  const refreshPublicData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setDataLoading(true)
    }
    setDataError('')

    try {
      const [loadedVenues, loadedEvents] = await Promise.all([
        getVenues(),
        getEvents(),
      ])

      setVenues(loadedVenues)
      setEvents(loadedEvents)

      setSelectedCity((currentCity) =>
        loadedVenues.length > 0 &&
        !loadedVenues.some((venue) => venue.city === currentCity)
          ? loadedVenues[0]?.city ?? 'Leszno'
          : currentCity,
      )
    } catch (error) {
      console.error('Nie udało się pobrać danych publicznych Event Times.', error)
      setDataError('Nie udało się pobrać danych. Odśwież stronę albo spróbuj później.')
      throw error
    } finally {
      if (showLoading) {
        setDataLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void refreshPublicData(true).catch(() => undefined)
  }, [refreshPublicData])

  useEffect(() => {
    if (!hasConsumedShareParamsRef.current) {
      return
    }

    const nextUrl = new URL(window.location.pathname, window.location.origin)

    if (selectedEvent) {
      nextUrl.searchParams.set('event', selectedEvent.id)
    } else if (selectedVenue) {
      nextUrl.searchParams.set('venue', selectedVenue.id)
    }

    window.history.replaceState(null, '', `${nextUrl.pathname}${nextUrl.search}`)
  }, [selectedEvent, selectedVenue])

  useEffect(() => {
    if (dataLoading || hasConsumedShareParamsRef.current) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const eventId = params.get('event')
    const venueId = params.get('venue')

    hasConsumedShareParamsRef.current = true

    if (eventId) {
      const event = events.find((candidate) => candidate.id === eventId)
      const venue = event
        ? venues.find((candidate) => candidate.id === event.venueId)
        : null

      if (event && venue) {
        selectEvent(event, venue)
      }

      return
    }

    if (venueId) {
      const venue = venues.find((candidate) => candidate.id === venueId)

      if (venue) {
        selectVenue(venue)
      }
    }
  }, [dataLoading, events, venues])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null)
    }, 3600)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

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

  // Panele miejsca i eventu współdzielą ten ref. Przy przejściu event <-> miejsce
  // stary panel odmontowuje się po animacji wyjścia i wyzerowałby element nowego,
  // więc null z odmontowania ignorujemy — stan "zamknięte" wykrywa isConnected.
  const setRightPanelElement = useCallback((node: HTMLElement | null) => {
    if (node) {
      rightPanelRef.current = node
    }
  }, [])

  // Zasłonięty przez otwarty panel fragment mapy (prawa kolumna na desktopie,
  // dolny arkusz na mobile). Mierzone w momencie centrowania, przez offsetLeft/
  // offsetTop — niewrażliwe na transformy animacji wejścia panelu.
  const getMapFocusPadding = useCallback((): MapFocusPadding => {
    const panel = rightPanelRef.current

    if (!panel || !panel.isConnected) {
      return { right: 0, bottom: 0 }
    }

    if (window.matchMedia(MOBILE_PANEL_MEDIA_QUERY).matches) {
      const obscuredHeight = window.innerHeight - panel.offsetTop

      // Pełnoekranowy panel (wąskie telefony) zakrywa całą mapę —
      // wtedy zwykłe centrowanie, żeby pinezka była na środku po zamknięciu.
      if (obscuredHeight <= 0 || obscuredHeight >= window.innerHeight * 0.95) {
        return { right: 0, bottom: 0 }
      }

      return { right: 0, bottom: obscuredHeight }
    }

    const obscuredWidth = window.innerWidth - panel.offsetLeft

    if (obscuredWidth <= 0 || obscuredWidth >= window.innerWidth * 0.95) {
      return { right: 0, bottom: 0 }
    }

    return { right: obscuredWidth, bottom: 0 }
  }, [])

  function focusVenueOnMap(venue: Venue) {
    // Nowy obiekt przy każdym wyborze, żeby mapa wycentrowała się ponownie.
    setVenueFocusCoordinates(
      hasValidVenueCoordinates(venue) ? { ...venue.coordinates } : null,
    )
  }

  function selectVenue(venue: Venue) {
    setIsAdminOpen(false)
    setIsAccountPanelOpen(false)
    setEventOrigin('direct')
    cancelMapMode()
    setSelectedCity(venue.city)
    setSelectedVenue(venue)
    setSelectedEvent(null)
    focusVenueOnMap(venue)
  }

  function selectEvent(event: EventTimesEvent, venue: Venue) {
    setIsAdminOpen(false)
    setIsAccountPanelOpen(false)
    setEventOrigin('direct')
    cancelMapMode()
    setSelectedCity(venue.city)
    setSelectedVenue(venue)
    setSelectedEvent(event)
    focusVenueOnMap(venue)
  }

  function selectEventFromVenue(event: EventTimesEvent, venue: Venue) {
    selectEvent(event, venue)
    setEventOrigin('venue')
  }

  function selectEventFromProfile(event: EventTimesEvent, venue: Venue) {
    selectEvent(event, venue)
    setEventOrigin('profile')
  }

  function showVenueForSelectedEvent(venue: Venue) {
    setSelectedEvent(null)
    setEventOrigin('direct')
    focusVenueOnMap(venue)
  }

  function returnToProfileFromEvent() {
    setSelectedVenue(null)
    setSelectedEvent(null)
    setEventOrigin('direct')
    setIsAccountPanelOpen(true)
  }

  function closePanel() {
    setSelectedVenue(null)
    setSelectedEvent(null)
    setVenueFocusCoordinates(null)
  }

  function focusMobileSearch() {
    setMobileSearchFocusRequest((requestCount) => requestCount + 1)
  }

  function openProfileFromMobile() {
    closePanel()
    setIsAdminOpen(false)

    if (user) {
      setIsAccountPanelOpen(true)
      return
    }

    openAuthModal()
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

  function showToast(message: string, tone: AppToast['tone'] = 'success') {
    setToast({ message, tone })
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
    showToast('Zaktualizowano miejsce.')
  }

  async function deleteVenue(venueId: string) {
    const confirmed = window.confirm(
      'Czy na pewno chcesz usunąć to miejsce? Usunięte zostaną także wydarzenia przypisane do tego miejsca.',
    )

    if (!confirmed) {
      return false
    }

    try {
      const [nextEvents, nextVenues] = await Promise.all([
        deleteEventsByVenueId(venueId),
        persistVenueDelete(venueId),
      ])
      setEvents(nextEvents)
      setVenues(nextVenues)

      if (selectedVenue?.id === venueId) {
        closePanel()
      }

      if (movingVenueId === venueId) {
        cancelMapMode()
      }

      showToast('Usunięto miejsce.')
      return true
    } catch (error) {
      console.error('Nie udało się usunąć miejsca.', error)
      showToast('Nie udało się usunąć miejsca.', 'error')
      return false
    }
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
        console.error('Nie udało się przesunąć pinezki.', error)
        showToast('Nie udało się przesunąć pinezki.', 'error')
      })
      cancelMapMode()
    }
  }

  async function addEvent(event: EventTimesEvent) {
    const nextEvents = await saveEvent(event)
    setEvents(nextEvents)
    showToast('Zapisano wydarzenie.')
  }

  async function addEventAndSelect(event: EventTimesEvent) {
    const nextEvents = await saveEvent(event)
    setEvents(nextEvents)
    showToast('Zapisano wydarzenie.')

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
    showToast('Zaktualizowano wydarzenie.')
  }

  async function deleteEvent(eventId: string) {
    const confirmed = window.confirm(
      'Czy na pewno chcesz usunąć to wydarzenie?',
    )

    if (!confirmed) {
      return false
    }

    try {
      setEvents(await persistEventDelete(eventId))

      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null)
      }

      showToast('Usunięto wydarzenie.')
      return true
    } catch (error) {
      console.error('Nie udało się usunąć wydarzenia.', error)
      showToast('Nie udało się usunąć wydarzenia.', 'error')
      return false
    }
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
    setVenueFocusCoordinates(null)
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
    showToast('Zaimportowano dane do Firestore.')
  }

  async function moveCurrentDataToFirestore() {
    await replaceVenuesInFirestore(venues)
    await replaceEventsInFirestore(events)
    setVenues(await getVenues())
    setEvents(await getEvents())
    showToast('Zaimportowano dane do Firestore.')
  }

  async function refreshAdminData() {
    try {
      await refreshPublicData(false)
      showToast('Odświeżono dane.')
    } catch {
      showToast('Nie udało się odświeżyć danych.', 'error')
    }
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
        searchFocusRequest={mobileSearchFocusRequest}
        onSearchOpenChange={setIsSearchOpen}
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
            <button
              className="map-error-retry-button"
              type="button"
              onClick={() => {
                void refreshPublicData(true).catch(() => undefined)
              }}
            >
              Spróbuj ponownie
            </button>
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
          focusCoordinates={draftVenueCoordinates ?? venueFocusCoordinates}
          getFocusPadding={getMapFocusPadding}
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
          <Suspense fallback={null}>
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
              onRefreshData={refreshAdminData}
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
          </Suspense>
        )}

        {isAccountPanelOpen && (
          <Suspense fallback={null}>
            <AccountPanel
              venues={venues}
              events={events}
              onVenueSelect={selectVenue}
              onEventSelect={selectEventFromProfile}
              onClose={() => setIsAccountPanelOpen(false)}
            />
          </Suspense>
        )}

        <AnimatePresence initial={false} mode="sync">
          {!isAdminOpen && !isAccountPanelOpen && selectedVenue && selectedEvent ? (
            <EventPanel
              key={`event-${selectedEvent.id}`}
              event={selectedEvent}
              venue={selectedVenue}
              venues={venues}
              isAdminMode={isAdmin && isAdminMode}
              onBack={() => setSelectedEvent(null)}
              onAddEvent={addEventAndSelect}
              onUpdateEvent={updateEvent}
              onDeleteEvent={() => deleteEvent(selectedEvent.id)}
              onClose={closePanel}
              onShowVenue={() => showVenueForSelectedEvent(selectedVenue)}
              origin={eventOrigin}
              onReturnToProfile={
                eventOrigin === 'profile' ? returnToProfileFromEvent : undefined
              }
              panelRef={setRightPanelElement}
            />
          ) : !isAdminOpen && !isAccountPanelOpen && selectedVenue ? (
            <VenuePanel
              key={`venue-${selectedVenue.id}`}
              venue={selectedVenue}
              events={selectedVenueEvents}
              isAdminMode={isAdmin && isAdminMode}
              isPinMoveActive={movingVenueId === selectedVenue.id}
              onEventSelect={(event) => selectEventFromVenue(event, selectedVenue)}
              venues={venues}
              onAddEvent={addEvent}
              onUpdateVenue={updateVenue}
              onDeleteVenue={() => deleteVenue(selectedVenue.id)}
              onMoveVenue={() => startMovingVenue(selectedVenue.id)}
              onClose={closePanel}
              panelRef={setRightPanelElement}
            />
          ) : null}
        </AnimatePresence>

        <MobileBottomBar
          isAdmin={isAdmin}
          isAdminMode={isAdminMode}
          isHidden={Boolean(
            selectedVenue ||
              isAdminOpen ||
              isAccountPanelOpen ||
              isAuthModalOpen ||
              isSearchOpen ||
              mapMode.type !== 'normal',
          )}
          onSearch={focusMobileSearch}
          onProfile={openProfileFromMobile}
          onAdmin={toggleAdminPanel}
        />

        {toast && (
          <div className={`app-toast app-toast-${toast.tone}`} role="status">
            {toast.message}
          </div>
        )}

        {dataLoading && (
          <div className="loading-overlay" role="status" aria-label="Ładowanie Event Times">
            <div className="loading-brand">Event Times</div>
            <div className="loading-spinner" aria-hidden="true" />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
