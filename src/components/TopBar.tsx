import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import eventTimesMark from '../assets/brand/event-times-mark.png'
import { SearchBar } from './SearchBar'

type TopBarProps = {
  selectedCity: string
  venues: Venue[]
  events: EventTimesEvent[]
  isAdminMode: boolean
  onCityChange: (city: string) => void
  onVenueSelect: (venue: Venue) => void
  onEventSelect: (event: EventTimesEvent, venue: Venue) => void
  onAdminToggle: () => void
}

export function TopBar({
  selectedCity,
  venues,
  events,
  isAdminMode,
  onCityChange,
  onVenueSelect,
  onEventSelect,
  onAdminToggle,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <button className="brand" type="button" aria-label="Event Times">
        <img className="brand-logo" src={eventTimesMark} alt="Event Times" />
      </button>

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
          aria-pressed={isAdminMode}
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
