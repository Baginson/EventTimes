import { Bike, Car, Footprints, LocateFixed, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTravelTime } from '../hooks/useTravelTime'
import type { TravelTimeErrorKind } from '../hooks/useTravelTime'
import type { TravelCoordinates, TravelMode } from '../services/travelTimeService'
import { formatTravelSummary } from '../utils/travelFormat'

const TRAVEL_MODES: Array<{ value: TravelMode; label: string; icon: LucideIcon }> = [
  { value: 'drive', label: 'Samochód', icon: Car },
  { value: 'walk', label: 'Pieszo', icon: Footprints },
  { value: 'bicycle', label: 'Rower', icon: Bike },
]

const ERROR_MESSAGES: Record<TravelTimeErrorKind, string> = {
  config: 'Brak konfiguracji backendu (VITE_EVENTTIMES_API_URL).',
  'geolocation-unsupported': 'Twoja przeglądarka nie udostępnia geolokalizacji.',
  'permission-denied':
    'Brak zgody na dostęp do lokalizacji. Zmień ustawienia przeglądarki i spróbuj ponownie.',
  'position-unavailable': 'Nie udało się ustalić Twojej lokalizacji.',
  'geolocation-timeout': 'Przekroczono czas oczekiwania na lokalizację.',
  'no-destination': 'Brak współrzędnych tego miejsca.',
  'request-failed': 'Nie udało się obliczyć dojazdu. Spróbuj ponownie.',
}

type TravelTimeSectionProps = {
  destination: TravelCoordinates | null
}

export function TravelTimeSection({ destination }: TravelTimeSectionProps) {
  const { mode, state, check, selectMode } = useTravelTime(destination)
  const isBusy = state.status === 'locating' || state.status === 'loading'

  return (
    <section className="travel-time-section" aria-label="Dojazd">
      <div className="travel-time-modes" role="group" aria-label="Środek transportu">
        {TRAVEL_MODES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            className={`travel-time-mode${mode === value ? ' is-active' : ''}`}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={mode === value}
            disabled={isBusy}
            onClick={() => selectMode(value)}
          >
            <Icon className="ui-icon" aria-hidden="true" />
          </button>
        ))}
      </div>

      {state.status === 'idle' && (
        <>
          <button
            className="travel-time-check"
            type="button"
            disabled={!destination}
            onClick={() => check()}
          >
            <LocateFixed className="ui-icon" aria-hidden="true" />
            Sprawdź dojazd
          </button>
          {!destination && (
            <p className="travel-time-error" role="alert">
              {ERROR_MESSAGES['no-destination']}
            </p>
          )}
        </>
      )}

      {state.status === 'locating' && (
        <p className="travel-time-status" role="status">
          Ustalanie Twojej lokalizacji…
        </p>
      )}

      {state.status === 'loading' && (
        <p className="travel-time-status" role="status">
          Obliczanie trasy…
        </p>
      )}

      {state.status === 'success' && (
        <p className="travel-time-result" role="status">
          {formatTravelSummary(state.result)}
        </p>
      )}

      {state.status === 'error' && (
        <>
          <p className="travel-time-error" role="alert">
            {ERROR_MESSAGES[state.kind]}
          </p>
          {state.kind !== 'no-destination' && (
            <button
              className="travel-time-retry"
              type="button"
              aria-label="Spróbuj ponownie"
              title="Spróbuj ponownie"
              onClick={() => check()}
            >
              <RefreshCw className="ui-icon" aria-hidden="true" />
            </button>
          )}
        </>
      )}
    </section>
  )
}
