export const CLOUDINARY_UPLOADS_ENABLED = Boolean(
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME &&
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
)

type CloudinaryUploadResponse = {
  secure_url?: string
  public_id?: string
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

function getCloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (
    typeof cloudName !== 'string' ||
    !cloudName.trim() ||
    typeof uploadPreset !== 'string' ||
    !uploadPreset.trim()
  ) {
    throw new Error('Przesyłanie zdjęć nie jest skonfigurowane.')
  }

  return {
    cloudName: cloudName.trim(),
    uploadPreset: uploadPreset.trim(),
  }
}

export async function uploadImageToCloudinary(
  file: File,
): Promise<{ url: string; publicId: string }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Wybierz plik graficzny.')
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Maksymalny rozmiar zdjęcia to 10 MB.')
  }

  if (!CLOUDINARY_UPLOADS_ENABLED) {
    throw new Error('Przesyłanie zdjęć nie jest skonfigurowane.')
  }

  const { cloudName, uploadPreset } = getCloudinaryConfig()
  const formData = new FormData()

  formData.set('file', file)
  formData.set('upload_preset', uploadPreset)

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      },
    )
    const data = (await response.json()) as CloudinaryUploadResponse

    if (!response.ok || !data.secure_url || !data.public_id) {
      console.error('Cloudinary upload failed', {
        status: response.status,
        response: data,
      })
      throw new Error('Nie udało się przesłać zdjęcia. Spróbuj ponownie.')
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Nie udało się przesłać zdjęcia. Spróbuj ponownie.'
    ) {
      throw error
    }

    console.error('Cloudinary upload request failed', error)
    throw new Error('Nie udało się przesłać zdjęcia. Spróbuj ponownie.')
  }
}
