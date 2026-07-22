// Współdzielone przez googleMaps.ts (parsowanie linków) i venueService.ts
// (walidacja importu/zapisu) — jedno miejsce definiujące, co znaczy "poprawna
// para współrzędnych", zamiast dwóch niezależnych, rozjeżdżających się reguł.
export function isValidCoordinates(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

export function getDistanceMeters(
  first: { lat: number; lng: number },
  second: { lat: number; lng: number },
) {
  const latMeters = (first.lat - second.lat) * 111_320
  const lngMeters =
    (first.lng - second.lng) *
    111_320 *
    Math.cos(((first.lat + second.lat) / 2) * (Math.PI / 180))

  return Math.sqrt(latMeters ** 2 + lngMeters ** 2)
}
