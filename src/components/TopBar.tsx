import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import eventTimesMark from '../assets/brand/event-times-mark.png'
import { SearchBar } from './SearchBar'
import { UserMenu } from './UserMenu'

type TopBarProps = {
  selectedCity: string
  venues: Venue[]
  events: EventTimesEvent[]
  isAdminMode: boolean
  isAdmin: boolean
  isRightPanelOpen: boolean
  onCityChange: (city: string) => void
  onVenueSelect: (venue: Venue) => void
  onEventSelect: (event: EventTimesEvent, venue: Venue) => void
  onAdminToggle: () => void
  onOpenProfile: () => void
}

export function TopBar({
  selectedCity,
  venues,
  events,
  isAdminMode,
  isAdmin,
  isRightPanelOpen,
  onCityChange,
  onVenueSelect,
  onEventSelect,
  onAdminToggle,
  onOpenProfile,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <button className="brand" type="button" aria-label="Event Times">
        <img className="brand-logo" src={eventTimesMark} alt="Event Times" />
        <span className="brand-copy" aria-hidden="true">
          <strong>Event Times</strong>
          <small>Mapa wydarzeń</small>
        </span>
      </button>

      <SearchBar
        selectedCity={selectedCity}
        venues={venues}
        events={events}
        onCityChange={onCityChange}
        onVenueSelect={onVenueSelect}
        onEventSelect={onEventSelect}
      />

      {!isRightPanelOpen && (
        <nav className="top-bar-actions" aria-label="Główne akcje">
          {isAdmin && (
            <button
              className="button button-secondary admin-toggle"
              type="button"
              aria-pressed={isAdminMode}
              onClick={onAdminToggle}
            >
              Panel admina
            </button>
          )}
          <UserMenu onOpenProfile={onOpenProfile} />
        </nav>
      )}
    </header>
  )
}
