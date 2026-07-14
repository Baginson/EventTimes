import type { MediaImage } from '../features/media/mediaModel'

export type EventTimesEvent = {
  id: string
  venueId: string
  name: string
  title?: string
  slug?: string
  eventType: string
  category?: string
  description: string
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
  ticketUrl?: string
  sourceUrl?: string
  imageUrl?: string
  images?: MediaImage[]
  organizer?: string
  isPromoted?: boolean
  status?: 'published' | 'draft' | 'cancelled'
  externalIds?: {
    ticketmaster?: string
  }
  createdAt?: string
  updatedAt?: string
}

// Dane są fikcyjne i służą wyłącznie do rozwijania oraz testowania aplikacji.
export const mockEvents: EventTimesEvent[] = [
  {
    id: 'mok-letni-koncert-kameralny-2026',
    venueId: 'mok-leszno',
    name: 'Letni koncert kameralny',
    eventType: 'Koncert',
    description: 'Wieczorny koncert lokalnych muzyków w kameralnej oprawie.',
    startDate: '2026-07-18T18:00:00+02:00',
    endDate: '2026-07-18T20:00:00+02:00',
    ticketUrl: 'https://example.com/bilety/letni-koncert-kameralny',
    sourceUrl: 'https://example.com/wydarzenia/letni-koncert-kameralny',
  },
  {
    id: 'mok-wieczor-komedii-2026',
    venueId: 'mok-leszno',
    name: 'Wieczór komedii',
    eventType: 'Stand-up',
    description: 'Testowy wieczór występów komediowych z udziałem kilku artystów.',
    startDate: '2026-08-07T19:00:00+02:00',
    endDate: '2026-08-07T21:00:00+02:00',
    ticketUrl: 'https://example.com/bilety/wieczor-komedii',
    sourceUrl: 'https://example.com/wydarzenia/wieczor-komedii',
    imageUrl: 'https://example.com/images/wieczor-komedii.jpg',
  },
  {
    id: 'mok-warsztaty-teatralne-2026',
    venueId: 'mok-leszno',
    name: 'Otwarte warsztaty teatralne',
    eventType: 'Teatr',
    description: 'Zajęcia teatralne dla osób chcących spróbować pracy na scenie.',
    startDate: '2026-09-12T10:00:00+02:00',
    endDate: '2026-09-12T14:00:00+02:00',
    ticketUrl: 'https://example.com/bilety/warsztaty-teatralne',
    sourceUrl: 'https://example.com/wydarzenia/warsztaty-teatralne',
  },
  {
    id: 'trapez-turniej-koszykowki-2026',
    venueId: 'hala-trapez',
    name: 'Leszczyński turniej koszykówki',
    eventType: 'Sport',
    description: 'Fikcyjny turniej drużyn z Leszna i okolic rozgrywany przez cały dzień.',
    startDate: '2026-07-25T09:00:00+02:00',
    endDate: '2026-07-25T18:00:00+02:00',
    ticketUrl: 'https://example.com/bilety/turniej-koszykowki',
    sourceUrl: 'https://example.com/wydarzenia/turniej-koszykowki',
    imageUrl: 'https://example.com/images/turniej-koszykowki.jpg',
  },
  {
    id: 'trapez-gala-sportow-walki-2026',
    venueId: 'hala-trapez',
    name: 'Gala sportów walki',
    eventType: 'Sport',
    description: 'Testowa gala prezentująca pojedynki zawodników z lokalnych klubów.',
    startDate: '2026-08-22T18:30:00+02:00',
    endDate: '2026-08-22T22:30:00+02:00',
    ticketUrl: 'https://example.com/bilety/gala-sportow-walki',
    sourceUrl: 'https://example.com/wydarzenia/gala-sportow-walki',
  },
  {
    id: 'trapez-rodzinny-dzien-sportu-2026',
    venueId: 'hala-trapez',
    name: 'Rodzinny dzień sportu',
    eventType: 'Spotkanie',
    description: 'Dzień prostych konkurencji sportowych i aktywności dla całych rodzin.',
    startDate: '2026-09-06T11:00:00+02:00',
    endDate: '2026-09-06T17:00:00+02:00',
    ticketUrl: 'https://example.com/bilety/rodzinny-dzien-sportu',
    sourceUrl: 'https://example.com/wydarzenia/rodzinny-dzien-sportu',
  },
  {
    id: 'stadion-mecz-zuzlowy-2026',
    venueId: 'stadion-alfreda-smoczyka',
    name: 'Wieczorny mecz żużlowy',
    eventType: 'Sport',
    description: 'Testowe spotkanie żużlowe przygotowane na potrzeby prezentacji aplikacji.',
    startDate: '2026-07-12T19:00:00+02:00',
    endDate: '2026-07-12T21:30:00+02:00',
    ticketUrl: 'https://example.com/bilety/wieczorny-mecz-zuzlowy',
    sourceUrl: 'https://example.com/wydarzenia/wieczorny-mecz-zuzlowy',
    imageUrl: 'https://example.com/images/wieczorny-mecz-zuzlowy.jpg',
  },
  {
    id: 'stadion-piknik-motoryzacyjny-2026',
    venueId: 'stadion-alfreda-smoczyka',
    name: 'Piknik motoryzacyjny',
    eventType: 'Festiwal',
    description: 'Rodzinny piknik z pokazami pojazdów i atrakcjami na terenie stadionu.',
    startDate: '2026-08-16T12:00:00+02:00',
    endDate: '2026-08-16T19:00:00+02:00',
    ticketUrl: 'https://example.com/bilety/piknik-motoryzacyjny',
    sourceUrl: 'https://example.com/wydarzenia/piknik-motoryzacyjny',
  },
  {
    id: 'stadion-koncert-pod-gwiazdami-2026',
    venueId: 'stadion-alfreda-smoczyka',
    name: 'Koncert pod gwiazdami',
    eventType: 'Koncert',
    description: 'Duży fikcyjny koncert plenerowy zamykający letni sezon wydarzeń.',
    startDate: '2026-08-29T18:00:00+02:00',
    endDate: '2026-08-29T23:00:00+02:00',
    ticketUrl: 'https://example.com/bilety/koncert-pod-gwiazdami',
    sourceUrl: 'https://example.com/wydarzenia/koncert-pod-gwiazdami',
    imageUrl: 'https://example.com/images/koncert-pod-gwiazdami.jpg',
  },
]
