import type { EventTimesEvent } from '../../data/mockEvents'
import { createExternalImage, getPreferredImageUrl } from '../media/mediaModel'
import type { MediaImage } from '../media/mediaModel'

export type CompatibleEvent = EventTimesEvent & {
  title?: string
  slug?: string
  category?: string
  startTime?: string
  endTime?: string
  images?: MediaImage[]
  status?: 'published' | 'draft' | 'cancelled'
}

export function getEventTitle(event: CompatibleEvent) {
  return event.title?.trim() || event.name
}

export function getEventCategory(event: CompatibleEvent) {
  return event.category?.trim() || event.eventType
}

export function getEventCoverImageUrl(event: CompatibleEvent) {
  return getPreferredImageUrl(event.images, event.imageUrl, ['cover', 'poster'])
}

export function createEventExternalImage(eventId: string, imageUrl?: string, title?: string) {
  return createExternalImage(
    `${eventId}-cover`,
    imageUrl,
    title?.trim() || 'Zdjecie wydarzenia',
    'cover',
  )
}

export function withCompatibleEventFields(event: CompatibleEvent): CompatibleEvent {
  const title = getEventTitle(event)
  const category = getEventCategory(event)
  const externalImage = createEventExternalImage(event.id, event.imageUrl, title)
  const images = event.images?.length ? event.images : externalImage ? [externalImage] : undefined

  return {
    ...event,
    name: event.name || title,
    eventType: event.eventType || category,
    title: event.title,
    category: event.category,
    images,
  }
}
