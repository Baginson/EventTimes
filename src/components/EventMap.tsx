import { useEffect } from 'react'
import { divIcon } from 'leaflet'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { Venue } from '../data/mockVenues'
import { getVenueDisplayName } from '../utils/venueDisplay'

type EventMapProps = {
  venues: Venue[]
  selectedVenueId: string | null
  isMapClickActive: boolean
  temporaryVenueCoordinates?: Venue['coordinates'] | null
  focusCoordinates?: Venue['coordinates'] | null
  onVenueSelect: (venue: Venue) => void
  onMapClick: (coordinates: Venue['coordinates']) => void
}

const LESZNO_CENTER: [number, number] = [51.8419, 16.5748]

function createVenueIcon(isSelected: boolean, isTemporary = false) {
  return divIcon({
    className: 'venue-marker-wrapper',
    html: `<span class="venue-marker${isSelected ? ' venue-marker-active' : ''}${isTemporary ? ' venue-marker-temporary' : ''}"><span></span></span>`,
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
}: {
  coordinates?: Venue['coordinates'] | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!coordinates) {
      return
    }

    map.setView([coordinates.lat, coordinates.lng], Math.max(map.getZoom(), 16), {
      animate: true,
    })
  }, [coordinates, map])

  return null
}

export function EventMap({
  venues,
  selectedVenueId,
  isMapClickActive,
  temporaryVenueCoordinates,
  focusCoordinates,
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
      <MapFocusHandler coordinates={focusCoordinates} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {temporaryVenueCoordinates && (
        <Marker
          position={[temporaryVenueCoordinates.lat, temporaryVenueCoordinates.lng]}
          icon={createVenueIcon(false, true)}
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
            icon={createVenueIcon(venue.id === selectedVenueId)}
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
