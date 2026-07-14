import { EVENT_TYPES } from '../data/searchFilters'

const TICKETMASTER_EVENTS_ENDPOINT =
  'https://app.ticketmaster.com/discovery/v2/events.json'

const SUPPORTED_EVENT_TYPES = new Set<string>(
  EVENT_TYPES.filter((eventType) => eventType !== 'Wszystkie'),
)

export type TicketmasterImage = {
  url?: string
  width?: number
  height?: number
  ratio?: string
  fallback?: boolean
}

export type TicketmasterClassification = {
  segment?: {
    name?: string
  }
  genre?: {
    name?: string
  }
  subGenre?: {
    name?: string
  }
}

export type TicketmasterVenue = {
  id?: string
  name?: string
  url?: string
  city?: {
    name?: string
  }
  address?: {
    line1?: string
    line2?: string
  }
  location?: {
    longitude?: string
    latitude?: string
  }
}

export type TicketmasterEvent = {
  id?: string
  name?: string
  url?: string
  dates?: {
    start?: {
      localDate?: string
      localTime?: string
      dateTime?: string
    }
  }
  images?: TicketmasterImage[]
  classifications?: TicketmasterClassification[]
  _embedded?: {
    venues?: TicketmasterVenue[]
  }
}

type TicketmasterSearchResponse = {
  _embedded?: {
    events?: TicketmasterEvent[]
  }
}

export type TicketmasterSearchParams = {
  keyword?: string
  city?: string
  latlong?: string
  radius?: string
  startDateTime?: string
  endDateTime?: string
  size?: number
}

export type TicketmasterImportCandidate = {
  ticketmasterId: string
  name: string
  eventType: string
  startDate: string
  endDate?: string
  ticketUrl?: string
  sourceUrl?: string
  imageUrl?: string
  venueName?: string
  venueCity?: string
  venueAddress?: string
  coordinates?: {
    lat: number
    lng: number
  }
  venueCandidate?: TicketmasterVenueCandidate
}

export type TicketmasterVenueCandidate = {
  ticketmasterVenueId?: string
  name: string
  city?: string
  address?: string
  coordinates?: {
    lat: number
    lng: number
  }
  sourceUrl?: string
}

export class TicketmasterConfigError extends Error {}

export class TicketmasterRequestError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

function getTicketmasterApiKey() {
  const apiKey = import.meta.env.VITE_TICKETMASTER_API_KEY

  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new TicketmasterConfigError('Brak VITE_TICKETMASTER_API_KEY w .env.local')
  }

  return apiKey
}

function appendOptionalParam(params: URLSearchParams, name: string, value?: string) {
  const normalizedValue = value?.trim()

  if (normalizedValue) {
    params.set(name, normalizedValue)
  }
}

function toTicketmasterDateTime(dateValue?: string, endOfDay = false) {
  if (!dateValue) {
    return undefined
  }

  return endOfDay ? `${dateValue}T23:59:59Z` : `${dateValue}T00:00:00Z`
}

function buildStartDate(rawEvent: TicketmasterEvent) {
  const start = rawEvent.dates?.start

  if (start?.dateTime) {
    return start.dateTime
  }

  if (start?.localDate && start.localTime) {
    return `${start.localDate}T${start.localTime}`
  }

  return start?.localDate ?? ''
}

function parseCoordinate(value?: string) {
  if (typeof value !== 'string') {
    return undefined
  }

  const coordinate = Number(value)
  return Number.isFinite(coordinate) ? coordinate : undefined
}

function mapTicketmasterVenueToCandidate(
  venue?: TicketmasterVenue,
): TicketmasterVenueCandidate | undefined {
  const name = venue?.name?.trim()

  if (!name) {
    return undefined
  }

  const lat = parseCoordinate(venue?.location?.latitude)
  const lng = parseCoordinate(venue?.location?.longitude)
  const coordinates =
    typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : undefined

  return {
    ticketmasterVenueId: venue?.id?.trim() || undefined,
    name,
    city: venue?.city?.name?.trim() || undefined,
    address: [venue?.address?.line1, venue?.address?.line2]
      .filter(Boolean)
      .join(', ') || undefined,
    coordinates,
    sourceUrl: venue?.url?.trim() || undefined,
  }
}

function getBestImageUrl(images?: TicketmasterImage[]) {
  if (!images?.length) {
    return undefined
  }

  const usableImages = images.filter((image) => image.url)

  if (!usableImages.length) {
    return undefined
  }

  const sortedImages = [...usableImages].sort((first, second) => {
    const firstScore = (first.width ?? 0) * (first.height ?? 0)
    const secondScore = (second.width ?? 0) * (second.height ?? 0)

    return secondScore - firstScore
  })

  return sortedImages[0]?.url
}

function mapClassificationToEventType(classifications?: TicketmasterClassification[]) {
  const primaryClassification = classifications?.[0]
  const names = [
    primaryClassification?.genre?.name,
    primaryClassification?.segment?.name,
    primaryClassification?.subGenre?.name,
  ]
    .filter((name): name is string => Boolean(name))
    .map((name) => name.toLocaleLowerCase('pl-PL'))

  if (names.some((name) => name.includes('music') || name.includes('muzyka'))) {
    return 'Koncert'
  }

  if (names.some((name) => name.includes('sports') || name.includes('sport'))) {
    return 'Sport'
  }

  if (names.some((name) => name.includes('comedy') || name.includes('komedia'))) {
    return 'Stand-up'
  }

  if (
    names.some(
      (name) =>
        name.includes('theatre') ||
        name.includes('theater') ||
        name.includes('arts') ||
        name.includes('sztuka'),
    )
  ) {
    return 'Teatr'
  }

  const directMatch = classifications
    ?.flatMap((classification) => [
      classification.genre?.name,
      classification.segment?.name,
      classification.subGenre?.name,
    ])
    .find(
      (name): name is string =>
        typeof name === 'string' && SUPPORTED_EVENT_TYPES.has(name),
    )

  return directMatch ?? 'Inne'
}

export function mapTicketmasterEventToCandidate(
  rawEvent: TicketmasterEvent,
): TicketmasterImportCandidate | null {
  const ticketmasterId = rawEvent.id?.trim()
  const name = rawEvent.name?.trim()
  const startDate = buildStartDate(rawEvent)

  if (!ticketmasterId || !name || !startDate) {
    return null
  }

  const venue = rawEvent._embedded?.venues?.[0]
  const venueCandidate = mapTicketmasterVenueToCandidate(venue)

  return {
    ticketmasterId,
    name,
    eventType: mapClassificationToEventType(rawEvent.classifications),
    startDate,
    ticketUrl: rawEvent.url,
    sourceUrl: rawEvent.url,
    imageUrl: getBestImageUrl(rawEvent.images),
    venueName: venueCandidate?.name,
    venueCity: venueCandidate?.city,
    venueAddress: venueCandidate?.address,
    coordinates: venueCandidate?.coordinates,
    venueCandidate,
  }
}

export async function searchTicketmasterEvents(
  searchParams: TicketmasterSearchParams,
): Promise<TicketmasterImportCandidate[]> {
  const params = new URLSearchParams({
    apikey: getTicketmasterApiKey(),
    countryCode: 'PL',
    unit: 'km',
    size: String(searchParams.size ?? 20),
  })

  appendOptionalParam(params, 'keyword', searchParams.keyword)
  appendOptionalParam(params, 'city', searchParams.city)
  appendOptionalParam(params, 'latlong', searchParams.latlong)
  appendOptionalParam(params, 'radius', searchParams.radius)
  appendOptionalParam(
    params,
    'startDateTime',
    toTicketmasterDateTime(searchParams.startDateTime),
  )
  appendOptionalParam(
    params,
    'endDateTime',
    toTicketmasterDateTime(searchParams.endDateTime, true),
  )

  const response = await fetch(`${TICKETMASTER_EVENTS_ENDPOINT}?${params.toString()}`)

  if (response.status === 429) {
    throw new TicketmasterRequestError(
      'Ticketmaster zwraca limit zapytań. Spróbuj ponownie za chwilę.',
      response.status,
    )
  }

  if (!response.ok) {
    throw new TicketmasterRequestError(
      'Nie udało się pobrać danych z Ticketmaster.',
      response.status,
    )
  }

  const data = (await response.json()) as TicketmasterSearchResponse

  if (!data || typeof data !== 'object') {
    throw new TicketmasterRequestError('Ticketmaster zwrócił niepoprawną odpowiedź.')
  }

  const rawEvents = data._embedded?.events

  if (!rawEvents) {
    return []
  }

  if (!Array.isArray(rawEvents)) {
    throw new TicketmasterRequestError('Ticketmaster zwrócił niepoprawną listę wydarzeń.')
  }

  return rawEvents.flatMap((rawEvent) => {
    const candidate = mapTicketmasterEventToCandidate(rawEvent)
    return candidate ? [candidate] : []
  })
}
