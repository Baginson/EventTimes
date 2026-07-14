import type { Venue } from '../../data/mockVenues'
import { createExternalImage, getPreferredImageUrl } from '../media/mediaModel'
import type { MediaImage } from '../media/mediaModel'

export type CompatibleVenue = Venue & {
  slug?: string
  type?: string
  category?: string
  country?: string
  capacity?: number
  images?: MediaImage[]
  status?: 'active' | 'draft' | 'archived'
}

export function getVenueCategory(venue: CompatibleVenue) {
  return venue.category?.trim() || venue.type?.trim() || venue.venueType
}

export function getVenueCoverImageUrl(venue: CompatibleVenue) {
  return getPreferredImageUrl(venue.images, venue.imageUrl, ['cover'])
}

export function createVenueExternalImage(venueId: string, imageUrl?: string, name?: string) {
  return createExternalImage(
    `${venueId}-cover`,
    imageUrl,
    name?.trim() || 'Zdjecie miejsca',
    'cover',
  )
}

export function withCompatibleVenueFields(venue: CompatibleVenue): CompatibleVenue {
  const category = getVenueCategory(venue)
  const externalImage = createVenueExternalImage(venue.id, venue.imageUrl, venue.name)
  const images = venue.images?.length ? venue.images : externalImage ? [externalImage] : undefined

  return {
    ...venue,
    venueType: venue.venueType || category,
    category: venue.category,
    type: venue.type,
    images,
  }
}
