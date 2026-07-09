export type Venue = {
  id: string
  name: string
  city: string
  address: string
  venueType: string
  coordinates: {
    lat: number
    lng: number
  }
  description: string
  googleMapsUrl?: string
  websiteUrl?: string
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

// TODO: Współrzędne są przybliżone i należy je zweryfikować przed użyciem produkcyjnym.
export const mockVenues: Venue[] = [
  {
    id: 'mok-leszno',
    name: 'MOK Leszno',
    city: 'Leszno',
    address: 'ul. Bolesława Chrobrego 3A, Leszno',
    venueType: 'Dom kultury',
    coordinates: {
      lat: 51.8419,
      lng: 16.5745,
    },
    description:
      'Miejski Ośrodek Kultury organizujący koncerty, spektakle i wydarzenia kulturalne.',
  },
  {
    id: 'hala-trapez',
    name: 'Hala Trapez',
    city: 'Leszno',
    address: 'ul. Zygmunta Starego 1, Leszno',
    venueType: 'Hala',
    coordinates: {
      lat: 51.847,
      lng: 16.5757,
    },
    description:
      'Hala widowiskowo-sportowa, w której odbywają się zawody, koncerty i inne wydarzenia.',
  },
  {
    id: 'stadion-alfreda-smoczyka',
    name: 'Stadion im. Alfreda Smoczyka',
    city: 'Leszno',
    address: 'ul. Strzelecka 7, Leszno',
    venueType: 'Stadion',
    coordinates: {
      lat: 51.8418,
      lng: 16.5986,
    },
    description:
      'Stadion żużlowy będący miejscem zawodów sportowych i dużych wydarzeń plenerowych.',
  },
  {
    id: 'rynek-leszno',
    name: 'Rynek w Lesznie',
    city: 'Leszno',
    address: 'Rynek, Leszno',
    venueType: 'Plener',
    coordinates: {
      lat: 51.8414,
      lng: 16.5747,
    },
    description:
      'Centralny plac Leszna, na którym odbywają się wydarzenia miejskie, jarmarki i koncerty plenerowe.',
  },
]
