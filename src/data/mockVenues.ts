export type Venue = {
  id: string
  name: string
  city: string
  address: string
  type: string
  coordinates: {
    lat: number
    lng: number
  }
  description: string
}

// TODO: Współrzędne są przybliżone i należy je zweryfikować przed użyciem produkcyjnym.
export const mockVenues: Venue[] = [
  {
    id: 'mok-leszno',
    name: 'MOK Leszno',
    city: 'Leszno',
    address: 'ul. Bolesława Chrobrego 3A, Leszno',
    type: 'centrum kultury',
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
    type: 'hala widowiskowo-sportowa',
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
    type: 'stadion',
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
    type: 'przestrzeń miejska',
    coordinates: {
      lat: 51.8414,
      lng: 16.5747,
    },
    description:
      'Centralny plac Leszna, na którym odbywają się wydarzenia miejskie, jarmarki i koncerty plenerowe.',
  },
]
