import { useEffect } from 'react'
import { useReducedMotion } from 'framer-motion'
import { divIcon } from 'leaflet'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { Venue } from '../data/mockVenues'
import { getVenueDisplayName } from '../utils/venueDisplay'

export type MapFocusPadding = {
  right: number
  bottom: number
}

type EventMapProps = {
  venues: Venue[]
  selectedVenueId: string | null
  isMapClickActive: boolean
  temporaryVenueCoordinates?: Venue['coordinates'] | null
  focusCoordinates?: Venue['coordinates'] | null
  getFocusPadding?: () => MapFocusPadding
  onVenueSelect: (venue: Venue) => void
  onMapClick: (coordinates: Venue['coordinates']) => void
}

const LESZNO_CENTER: [number, number] = [51.8419, 16.5748]

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case "'":
        return '&#39;'
      default:
        return character
    }
  })
}

function createVenueIcon(label: string, isSelected: boolean, isTemporary = false) {
  return divIcon({
    className: 'venue-marker-wrapper',
    html: `<span class="venue-marker${isSelected ? ' venue-marker-active' : ''}${isTemporary ? ' venue-marker-temporary' : ''}" role="img" aria-label="${escapeHtml(label)}"><span></span></span>`,
    iconAnchor: [18, 42],
    iconSize: [36, 42],
    tooltipAnchor: [0, -36],
  })
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (coordinates: Venue['coordinates']) => void
}) {
  useMapEvents({
    click(event) {
      // Obiekt Leaflet zostaje w providerze mapy. Na zewnątrz wychodzi tylko { lat, lng }.
      onMapClick({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })

  return null
}

function MapFocusHandler({
  coordinates,
  getFocusPadding,
}: {
  coordinates?: Venue['coordinates'] | null
  getFocusPadding?: () => MapFocusPadding
}) {
  const map = useMap()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!coordinates) {
      return
    }

    const padding = getFocusPadding?.() ?? { right: 0, bottom: 0 }
    const zoom = Math.max(map.getZoom(), 16)
    // Środek widoku przesunięty o połowę obszaru zasłoniętego panelem,
    // żeby pinezka wylądowała na środku widocznej części mapy.
    const centerPoint = map
      .project([coordinates.lat, coordinates.lng], zoom)
      .add([padding.right / 2, padding.bottom / 2])

    map.setView(map.unproject(centerPoint, zoom), zoom, {
      animate: !shouldReduceMotion,
    })
  }, [coordinates, getFocusPadding, map, shouldReduceMotion])

  return null
}

export function EventMap({
  venues,
  selectedVenueId,
  isMapClickActive,
  temporaryVenueCoordinates,
  focusCoordinates,
  getFocusPadding,
  onVenueSelect,
  onMapClick,
}: EventMapProps) {
  return (
    <MapContainer
      className={`event-map${isMapClickActive ? ' pin-move-active' : ''}`}
      center={LESZNO_CENTER}
      zoom={14}
      minZoom={12}
      scrollWheelZoom
    >
      {isMapClickActive && <MapClickHandler onMapClick={onMapClick} />}
      <MapFocusHandler coordinates={focusCoordinates} getFocusPadding={getFocusPadding} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {temporaryVenueCoordinates && (
        <Marker
          position={[temporaryVenueCoordinates.lat, temporaryVenueCoordinates.lng]}
          icon={createVenueIcon('Nowe miejsce', false, true)}
        >
          <Tooltip direction="top">Nowe miejsce</Tooltip>
        </Marker>
      )}

      {venues.map((venue) => {
        // Leaflet oczekuje [lat, lng]. Konwersja pozostaje wewnątrz warstwy mapy.
        const position: [number, number] = [
          venue.coordinates.lat,
          venue.coordinates.lng,
        ]

        return (
          <Marker
            key={venue.id}
            position={position}
            icon={createVenueIcon(getVenueDisplayName(venue), venue.id === selectedVenueId)}
            eventHandlers={{
              click: () => {
                if (!isMapClickActive) {
                  onVenueSelect(venue)
                }
              },
            }}
          >
            <Tooltip direction="top">{getVenueDisplayName(venue)}</Tooltip>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
