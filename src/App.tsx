import { useState } from 'react'
import { EventMap } from './components/EventMap'
import { TopBar } from './components/TopBar'
import { VenuePanel } from './components/VenuePanel'
import { mockEvents } from './data/mockEvents'
import { mockVenues } from './data/mockVenues'
import type { Venue } from './data/mockVenues'
import './App.css'

function App() {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)

  const selectedVenueEvents = selectedVenue
    ? mockEvents.filter((event) => event.venueId === selectedVenue.id)
    : []

  return (
    <div className="app-shell">
      <TopBar />

      <main className="map-workspace">
        <EventMap
          venues={mockVenues}
          selectedVenueId={selectedVenue?.id ?? null}
          onVenueSelect={setSelectedVenue}
        />

        {selectedVenue && (
          <VenuePanel
            venue={selectedVenue}
            events={selectedVenueEvents}
            onClose={() => setSelectedVenue(null)}
          />
        )}
      </main>
    </div>
  )
}

export default App
