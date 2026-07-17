type ShareParams = {
  venueId?: string
  eventId?: string
}

export function buildShareUrl({ venueId, eventId }: ShareParams): string {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
  const params = new URLSearchParams()

  if (eventId) {
    params.set('event', eventId)
  } else if (venueId) {
    params.set('venue', venueId)
  }

  baseUrl.search = params.toString()

  return baseUrl.toString()
}

export async function shareUrl(
  url: string,
  title: string,
): Promise<'shared' | 'copied'> {
  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return 'shared'
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('share-cancelled')
      }

      throw error
    }
  }

  await navigator.clipboard.writeText(url)
  return 'copied'
}
