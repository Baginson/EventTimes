import { divIcon } from 'leaflet'
import { MapContainer, Marker, TileLayer, Tooltip, useMapEvents } from 'react-leaflet'
import type { Venue } from '../data/mockVenues'

type EventMapProps = {
  venues: Venue[]
  selectedVenueId: string | null
  isPinMoveActive: boolean
  onVenueSelect: (venue: Venue) => void
  onMapClick: (coordinates: Venue['coordinates']) => void
}

const LESZNO_CENTER: [number, number] = [51.8419, 16.5748]

function createVenueIcon(isSelected: boolean) {
  return divIcon({
    className: 'venue-marker-wrapper',
    html: `<span class="venue-marker${isSelected ? ' venue-marker-active' : ''}"><span></span></span>`,
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

export function EventMap({
  venues,
  selectedVenueId,
  isPinMoveActive,
  onVenueSelect,
  onMapClick,
}: EventMapProps) {
  return (
    <MapContainer
      className={`event-map${isPinMoveActive ? ' pin-move-active' : ''}`}
      center={LESZNO_CENTER}
      zoom={14}
      minZoom={12}
      scrollWheelZoom
    >
      {isPinMoveActive && <MapClickHandler onMapClick={onMapClick} />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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
                if (!isPinMoveActive) {
                  onVenueSelect(venue)
                }
              },
            }}
          >
            <Tooltip direction="top">{venue.name}</Tooltip>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
