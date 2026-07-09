import { EVENT_DATE_FILTERS, EVENT_TYPES } from '../data/searchFilters'
import type { EventDateFilter, EventTypeFilter } from '../data/searchFilters'

export type CustomDateMode = 'single' | 'range'

type EventFiltersProps = {
  eventType: EventTypeFilter
  dateFilter: EventDateFilter
  customDateMode: CustomDateMode
  customDate: string
  customDateFrom: string
  customDateTo: string
  onEventTypeChange: (eventType: EventTypeFilter) => void
  onDateFilterChange: (dateFilter: EventDateFilter) => void
  onCustomDateModeChange: (mode: CustomDateMode) => void
  onCustomDateChange: (date: string) => void
  onCustomDateFromChange: (date: string) => void
  onCustomDateToChange: (date: string) => void
}

export function EventFilters({
  eventType,
  dateFilter,
  customDateMode,
  customDate,
  customDateFrom,
  customDateTo,
  onEventTypeChange,
  onDateFilterChange,
  onCustomDateModeChange,
  onCustomDateChange,
  onCustomDateFromChange,
  onCustomDateToChange,
}: EventFiltersProps) {
  return (
    <div className="event-filters">
      <label className="search-filter">
        <span>Typ wydarzenia</span>
        <select
          value={eventType}
          onChange={(event) => onEventTypeChange(event.target.value as EventTypeFilter)}
        >
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label className="search-filter">
        <span>Data</span>
        <select
          value={dateFilter}
          onChange={(event) => onDateFilterChange(event.target.value as EventDateFilter)}
        >
          {EVENT_DATE_FILTERS.map((filter) => (
            <option key={filter} value={filter}>
              {filter}
            </option>
          ))}
        </select>
      </label>

      {dateFilter === 'Wybierz datę' && (
        <div className="custom-date-filter">
          <div className="custom-date-mode" role="group" aria-label="Tryb wyboru daty">
            <button
              type="button"
              className={customDateMode === 'single' ? 'is-active' : ''}
              aria-pressed={customDateMode === 'single'}
              onClick={() => onCustomDateModeChange('single')}
            >
              Jeden dzień
            </button>
            <button
              type="button"
              className={customDateMode === 'range' ? 'is-active' : ''}
              aria-pressed={customDateMode === 'range'}
              onClick={() => onCustomDateModeChange('range')}
            >
              Zakres od–do
            </button>
          </div>

          {customDateMode === 'single' ? (
            <label className="search-filter custom-date-input">
              <span>Data</span>
              <input
                type="date"
                value={customDate}
                onChange={(event) => onCustomDateChange(event.target.value)}
              />
            </label>
          ) : (
            <div className="custom-date-range">
              <label className="search-filter custom-date-input">
                <span>Od</span>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(event) => onCustomDateFromChange(event.target.value)}
                />
              </label>
              <label className="search-filter custom-date-input">
                <span>Do</span>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(event) => onCustomDateToChange(event.target.value)}
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
