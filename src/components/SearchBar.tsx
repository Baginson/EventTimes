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
import type { CustomDateMode } from './EventFilters'

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
  const [customDateMode, setCustomDateMode] = useState<CustomDateMode>('single')
  const [customDate, setCustomDate] = useState('')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
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

  const searchLabel = mode === 'venues' ? 'Szukaj miejsc' : 'Szukaj wydarzeń'

  return (
    <div
      className={`search-area${isOpen ? ' is-open' : ''}`}
      ref={searchAreaRef}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className={`search-box${isOpen ? ' is-open' : ''}`}>
        <span className="visually-hidden">{searchLabel}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
        </svg>
        <input
          type="search"
          value={query}
          placeholder={searchLabel}
          aria-label={searchLabel}
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
        <button
          className="search-chevron"
          type="button"
          aria-label={isOpen ? 'Zwiń wyszukiwarkę' : 'Rozwiń wyszukiwarkę'}
          aria-expanded={isOpen}
          aria-controls="search-dropdown"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setIsOpen((current) => !current)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m6 8 4 4 4-4" />
          </svg>
          {hasActiveFilters && <span className="search-filter-indicator" />}
        </button>
      </div>

      {isOpen && (
        <div id="search-dropdown" onPointerDown={(event) => event.stopPropagation()}>
          <SearchDropdown
            mode={mode}
            query={query}
            selectedCity={selectedCity}
            venueType={venueType}
            eventType={eventType}
            dateFilter={dateFilter}
            customDateMode={customDateMode}
            customDate={customDate}
            customDateFrom={customDateFrom}
            customDateTo={customDateTo}
            venues={venues}
            events={events}
            onModeChange={changeMode}
            onCityChange={onCityChange}
            onVenueTypeChange={setVenueType}
            onEventTypeChange={setEventType}
            onDateFilterChange={setDateFilter}
            onCustomDateModeChange={setCustomDateMode}
            onCustomDateChange={setCustomDate}
            onCustomDateFromChange={setCustomDateFrom}
            onCustomDateToChange={setCustomDateTo}
            onVenueSelect={selectVenue}
            onEventSelect={selectEvent}
          />
        </div>
      )}
    </div>
  )
}
