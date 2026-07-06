import { useEffect, useRef, useState } from 'react'
import type {
  EventDateFilter,
  EventTypeFilter,
  SearchMode,
  VenueTypeFilter,
} from '../data/searchFilters'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { SearchDropdown } from './SearchDropdown'

type SearchBarProps = {
  selectedCity: string
  venues: Venue[]
  events: EventTimesEvent[]
  onCityChange: (city: string) => void
  onVenueSelect: (venue: Venue) => void
  onEventSelect: (event: EventTimesEvent, venue: Venue) => void
}

export function SearchBar({
  selectedCity,
  venues,
  events,
  onCityChange,
  onVenueSelect,
  onEventSelect,
}: SearchBarProps) {
  const [mode, setMode] = useState<SearchMode>('venues')
  const [query, setQuery] = useState('')
  const [venueType, setVenueType] = useState<VenueTypeFilter>('Wszystkie')
  const [eventType, setEventType] = useState<EventTypeFilter>('Wszystkie')
  const [dateFilter, setDateFilter] = useState<EventDateFilter>('Wszystkie')
  const [isOpen, setIsOpen] = useState(false)
  const searchAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      if (!searchAreaRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)

        if (event.target instanceof HTMLElement) {
          event.target.blur()
        }
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function changeMode(nextMode: SearchMode) {
    setMode(nextMode)
    setQuery('')
  }

  function selectVenue(venue: Venue) {
    onVenueSelect(venue)
    setIsOpen(false)
  }

  function selectEvent(event: EventTimesEvent, venue: Venue) {
    onEventSelect(event, venue)
    setIsOpen(false)
  }

  const hasActiveFilters =
    mode === 'venues'
      ? venueType !== 'Wszystkie'
      : eventType !== 'Wszystkie' || dateFilter !== 'Wszystkie'

  return (
    <div className={`search-area${isOpen ? ' is-open' : ''}`} ref={searchAreaRef}>
      <label className={`search-box${isOpen ? ' is-open' : ''}`}>
        <span className="visually-hidden">
          {mode === 'venues' ? 'Szukaj miejsc' : 'Szukaj wydarzeń'}
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
        </svg>
        <input
          type="search"
          value={query}
          placeholder={mode === 'venues' ? 'Szukaj miejsc' : 'Szukaj wydarzeń'}
          aria-expanded={isOpen}
          aria-controls="search-dropdown"
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false)
              event.currentTarget.blur()
            }
          }}
        />
        <span className="search-chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20">
            <path d="m6 8 4 4 4-4" />
          </svg>
          {hasActiveFilters && <span className="search-filter-indicator" />}
        </span>
      </label>

      {isOpen && (
        <div id="search-dropdown">
          <SearchDropdown
            mode={mode}
            query={query}
            selectedCity={selectedCity}
            venueType={venueType}
            eventType={eventType}
            dateFilter={dateFilter}
            venues={venues}
            events={events}
            onModeChange={changeMode}
            onCityChange={onCityChange}
            onVenueTypeChange={setVenueType}
            onEventTypeChange={setEventType}
            onDateFilterChange={setDateFilter}
            onVenueSelect={selectVenue}
            onEventSelect={selectEvent}
          />
        </div>
      )}
    </div>
  )
}
