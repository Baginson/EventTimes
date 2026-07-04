import { VENUE_TYPES } from '../data/searchFilters'
import type { VenueTypeFilter as VenueTypeFilterValue } from '../data/searchFilters'

type VenueTypeFilterProps = {
  value: VenueTypeFilterValue
  onChange: (venueType: VenueTypeFilterValue) => void
}

export function VenueTypeFilter({ value, onChange }: VenueTypeFilterProps) {
  return (
    <label className="search-filter">
      <span>Typ miejsca</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as VenueTypeFilterValue)}
      >
        {VENUE_TYPES.map((venueType) => (
          <option key={venueType} value={venueType}>
            {venueType}
          </option>
        ))}
      </select>
    </label>
  )
}
