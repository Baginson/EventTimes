import type { EventTimesEvent } from '../../data/mockEvents'
import { createExternalImage } from '../media/mediaModel'
import type { MediaImage } from '../media/mediaModel'

export type CompatibleEvent = EventTimesEvent & {
  title?: string
  slug?: string
  category?: string
  startTime?: string
  endTime?: string
  images?: MediaImage[]
}

export function getEventTitle(event: CompatibleEvent) {
  return event.title?.trim() || event.name
}

export function createEventExternalImage(eventId: string, imageUrl?: string, title?: string) {
  return createExternalImage(
    `${eventId}-cover`,
    imageUrl,
    title?.trim() || 'Zdjecie wydarzenia',
    'cover',
  )
}
