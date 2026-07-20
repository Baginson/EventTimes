export function formatTravelDuration(durationSeconds: number) {
  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60))

  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return minutes ? `${hours} godz. ${minutes} min` : `${hours} godz.`
}

export function formatTravelDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.max(10, Math.round(distanceMeters / 10) * 10)} m`
  }

  const kilometers = distanceMeters / 1000

  if (kilometers >= 10) {
    return `${Math.round(kilometers).toLocaleString('pl-PL')} km`
  }

  const rounded = Math.round(kilometers * 10) / 10
  return `${rounded.toLocaleString('pl-PL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`
}

export function formatTravelSummary(result: {
  durationSeconds: number
  distanceMeters: number
}) {
  return `Około ${formatTravelDuration(result.durationSeconds)} • ${formatTravelDistance(
    result.distanceMeters,
  )}`
}
