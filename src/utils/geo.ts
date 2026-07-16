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
