import type { SearchMode } from '../data/searchFilters'

type SearchModeTabsProps = {
  value: SearchMode
  onChange: (mode: SearchMode) => void
}

export function SearchModeTabs({ value, onChange }: SearchModeTabsProps) {
  return (
    <div className="search-mode-tabs" role="tablist" aria-label="Tryb wyszukiwania">
      <button
        type="button"
        role="tab"
        aria-selected={value === 'venues'}
        className={value === 'venues' ? 'search-mode-active' : ''}
        onClick={() => onChange('venues')}
      >
        Miejsca
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'events'}
        className={value === 'events' ? 'search-mode-active' : ''}
        onClick={() => onChange('events')}
      >
        Wydarzenia
      </button>
    </div>
  )
}
