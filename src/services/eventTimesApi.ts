export class EventTimesApiConfigError extends Error {}

function readConfiguredBaseUrl() {
  const baseUrl = import.meta.env.VITE_EVENTTIMES_API_URL

  if (typeof baseUrl !== 'string' || !baseUrl.trim()) {
    return undefined
  }

  return baseUrl.trim().replace(/\/+$/, '')
}

export const EVENTTIMES_API_CONFIGURED = Boolean(readConfiguredBaseUrl())

export function getEventTimesApiUrl(path: string) {
  const baseUrl = readConfiguredBaseUrl()

  if (!baseUrl) {
    throw new EventTimesApiConfigError('Brak VITE_EVENTTIMES_API_URL w .env.local')
  }

  return `${baseUrl}${path}`
}
