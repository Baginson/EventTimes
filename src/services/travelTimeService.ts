import { getEventTimesApiUrl } from './eventTimesApi'

export type TravelMode = 'drive' | 'walk' | 'bicycle'

export type TravelCoordinates = {
  lat: number
  lng: number
}

export type TravelTimeResult = {
  mode: TravelMode
  durationSeconds: number
  durationMinutes: number
  distanceMeters: number
  distanceKilometers: number
}

export class TravelTimeRequestError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

export async function fetchTravelTime(
  origin: TravelCoordinates,
  destination: TravelCoordinates,
  mode: TravelMode,
): Promise<TravelTimeResult> {
  const response = await fetch(getEventTimesApiUrl('/api/travel-time'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination, mode }),
  })

  if (!response.ok) {
    throw new TravelTimeRequestError(
      'Nie udało się obliczyć dojazdu.',
      response.status,
    )
  }

  const data = (await response.json()) as Partial<TravelTimeResult> | null

  if (
    !data ||
    typeof data.durationSeconds !== 'number' ||
    !Number.isFinite(data.durationSeconds) ||
    typeof data.distanceMeters !== 'number' ||
    !Number.isFinite(data.distanceMeters)
  ) {
    throw new TravelTimeRequestError('Backend zwrócił niepoprawną odpowiedź dojazdu.')
  }

  return {
    mode,
    durationSeconds: data.durationSeconds,
    durationMinutes:
      typeof data.durationMinutes === 'number' && Number.isFinite(data.durationMinutes)
        ? data.durationMinutes
        : Math.round(data.durationSeconds / 60),
    distanceMeters: data.distanceMeters,
    distanceKilometers:
      typeof data.distanceKilometers === 'number' &&
      Number.isFinite(data.distanceKilometers)
        ? data.distanceKilometers
        : data.distanceMeters / 1000,
  }
}
