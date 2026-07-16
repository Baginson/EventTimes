import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronDown, Search } from 'lucide-react'
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
  focusRequest?: number
  onOpenChange?: (isOpen: boolean) => void
}

export function SearchBar({
  selectedCity,
  venues,
  events,
  onCityChange,
  onVenueSelect,
  onEventSelect,
  focusRequest = 0,
  onOpenChange,
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
  const shouldReduceMotion = useReducedMotion()
  const searchAreaRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (focusRequest <= 0) {
      return
    }

    setIsOpen(true)
    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })
  }, [focusRequest])

  useEffect(() => {
    onOpenChange?.(isOpen)
  }, [isOpen, onOpenChange])

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

  const searchKicker =
    mode === 'venues' ? `Miejsca w ${selectedCity}` : `Wydarzenia w ${selectedCity}`
  const hasQuery = query.trim().length > 0
  const dropdownMotion = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, pointerEvents: 'auto' },
        exit: { opacity: 0, pointerEvents: 'none' },
        transition: { duration: 0.12 },
      }
    : {
        initial: {
          opacity: 0,
          transform: 'translateY(-6px) scaleY(0.98)',
        },
        animate: {
          opacity: 1,
          pointerEvents: 'auto',
          transform: 'translateY(0) scaleY(1)',
        },
        exit: {
          opacity: 0,
          pointerEvents: 'none',
          transform: 'translateY(-4px) scaleY(0.985)',
        },
        transition: { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] as const },
      }

  return (
    <div
      className={`search-area${isOpen ? ' is-open' : ''}`}
      ref={searchAreaRef}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className={`search-box${isOpen ? ' is-open' : ''}`}>
        <span className="visually-hidden">{searchLabel}</span>
        <span className={`search-leading-icon${hasQuery ? ' has-query' : ''}`} aria-hidden="true">
          <Search className="ui-icon search-leading-search" />
          <ArrowRight className="ui-icon search-leading-action" />
        </span>
        <span className="search-input-shell">
          <span className="search-kicker" aria-hidden="true">
            {searchKicker}
          </span>
          <input
            ref={searchInputRef}
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
        </span>
        <button
          className="search-chevron"
          type="button"
          aria-label={isOpen ? 'Zwiń wyszukiwarkę' : 'Rozwiń wyszukiwarkę'}
          aria-expanded={isOpen}
          aria-controls="search-dropdown"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setIsOpen((current) => !current)}
        >
          <ChevronDown className="ui-icon" aria-hidden="true" />
          {hasActiveFilters && <span className="search-filter-indicator" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
        <motion.div
          id="search-dropdown"
          key="search-dropdown"
          {...dropdownMotion}
          onPointerDown={(event) => event.stopPropagation()}
        >
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
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
