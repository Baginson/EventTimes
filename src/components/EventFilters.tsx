import { EVENT_DATE_FILTERS, EVENT_TYPES } from '../data/searchFilters'
import type { EventDateFilter, EventTypeFilter } from '../data/searchFilters'

type EventFiltersProps = {
  eventType: EventTypeFilter
  dateFilter: EventDateFilter
  onEventTypeChange: (eventType: EventTypeFilter) => void
  onDateFilterChange: (dateFilter: EventDateFilter) => void
}

export function EventFilters({
  eventType,
  dateFilter,
  onEventTypeChange,
  onDateFilterChange,
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
        {dateFilter === 'Wybierz datę' && (
          <small className="filter-placeholder">Własny wybór daty dodamy później.</small>
        )}
      </label>
    </div>
  )
}
