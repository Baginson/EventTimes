import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { SearchBar } from './SearchBar'

type TopBarProps = {
  selectedCity: string
  venues: Venue[]
  events: EventTimesEvent[]
  isAdminOpen: boolean
  onCityChange: (city: string) => void
  onVenueSelect: (venue: Venue) => void
  onEventSelect: (event: EventTimesEvent, venue: Venue) => void
  onAdminToggle: () => void
}

export function TopBar({
  selectedCity,
  venues,
  events,
  isAdminOpen,
  onCityChange,
  onVenueSelect,
  onEventSelect,
  onAdminToggle,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <a className="brand" href="/" aria-label="Event Times — strona główna">
        <span className="brand-mark" aria-hidden="true">
          ET
        </span>
        <span>Event Times</span>
      </a>

      <SearchBar
        selectedCity={selectedCity}
        venues={venues}
        events={events}
        onCityChange={onCityChange}
        onVenueSelect={onVenueSelect}
        onEventSelect={onEventSelect}
      />

      <nav className="top-bar-actions" aria-label="Główne akcje">
        <button
          className="button button-secondary admin-toggle"
          type="button"
          aria-pressed={isAdminOpen}
          onClick={onAdminToggle}
        >
          Panel admina
        </button>
        <button className="button button-primary" type="button">
          Zaloguj się
        </button>
      </nav>
    </header>
  )
}
