export type MediaImageType = 'cover' | 'gallery' | 'poster'
export type MediaImageSource = 'mock' | 'local' | 'future-storage' | 'external'

export type MediaImage = {
  id: string
  url: string
  alt: string
  type: MediaImageType
  source: MediaImageSource
  createdAt?: string
}

export function isMediaImage(value: unknown): value is MediaImage {
  if (!value || typeof value !== 'object') {
    return false
  }

  const image = value as Partial<MediaImage>

  return (
    typeof image.id === 'string' &&
    typeof image.url === 'string' &&
    typeof image.alt === 'string' &&
    (image.type === 'cover' || image.type === 'gallery' || image.type === 'poster') &&
    (image.source === 'mock' ||
      image.source === 'local' ||
      image.source === 'future-storage' ||
      image.source === 'external') &&
    (image.createdAt === undefined || typeof image.createdAt === 'string')
  )
}

export function getPreferredImage(
  images?: MediaImage[],
  preferredTypes: MediaImageType[] = ['cover', 'poster'],
) {
  if (!images?.length) {
    return undefined
  }

  return (
    preferredTypes
      .map((type) => images.find((image) => image.type === type && image.url.trim()))
      .find(Boolean) ?? images.find((image) => image.url.trim())
  )
}

export function getPreferredImageUrl(
  images: MediaImage[] | undefined,
  fallbackUrl?: string,
  preferredTypes?: MediaImageType[],
) {
  return getPreferredImage(images, preferredTypes)?.url ?? fallbackUrl
}

export function createExternalImage(
  id: string,
  url: string | undefined,
  alt: string,
  type: MediaImageType,
): MediaImage | undefined {
  if (!url?.trim()) {
    return undefined
  }

  return {
    id,
    url: url.trim(),
    alt,
    type,
    source: 'external',
  }
}
