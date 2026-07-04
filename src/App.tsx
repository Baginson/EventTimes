import { useState } from 'react'
import { EventMap } from './components/EventMap'
import { EventPanel } from './components/EventPanel'
import { TopBar } from './components/TopBar'
import { VenuePanel } from './components/VenuePanel'
import { mockEvents } from './data/mockEvents'
import type { EventTimesEvent } from './data/mockEvents'
import { mockVenues } from './data/mockVenues'
import type { Venue } from './data/mockVenues'
import './App.css'

function App() {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventTimesEvent | null>(null)
  const [selectedCity, setSelectedCity] = useState('Leszno')

  const visibleVenues = mockVenues.filter((venue) => venue.city === selectedCity)

  const selectedVenueEvents = selectedVenue
    ? mockEvents.filter((event) => event.venueId === selectedVenue.id)
    : []

  function selectVenue(venue: Venue) {
    setSelectedVenue(venue)
    setSelectedEvent(null)
  }

  function selectEvent(event: EventTimesEvent, venue: Venue) {
    setSelectedVenue(venue)
    setSelectedEvent(event)
  }

  function closePanel() {
    setSelectedVenue(null)
    setSelectedEvent(null)
  }

  return (
    <div className="app-shell">
      <TopBar
        selectedCity={selectedCity}
        venues={mockVenues}
        events={mockEvents}
        onCityChange={setSelectedCity}
        onVenueSelect={selectVenue}
        onEventSelect={selectEvent}
      />

      <main className="map-workspace">
        <EventMap
          venues={visibleVenues}
          selectedVenueId={selectedVenue?.id ?? null}
          onVenueSelect={selectVenue}
        />

        {selectedVenue && selectedEvent ? (
          <EventPanel
            event={selectedEvent}
            venue={selectedVenue}
            onBack={() => setSelectedEvent(null)}
            onClose={closePanel}
          />
        ) : selectedVenue ? (
          <VenuePanel
            venue={selectedVenue}
            events={selectedVenueEvents}
            onEventSelect={(event) => selectEvent(event, selectedVenue)}
            onClose={closePanel}
          />
        ) : null}
      </main>
    </div>
  )
}

export default App
