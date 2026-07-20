import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Clock,
  Image,
  LogOut,
  Pencil,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/authContext'
import { getAuthErrorMessage } from '../auth/authErrors'
import {
  getLinkedMethods,
  oauthProviderLabels,
} from '../auth/authProviders'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import { MOBILE_PANEL_MEDIA_QUERY } from '../constants/breakpoints'
import { EVENT_TYPES } from '../data/searchFilters'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { EventTimesApiConfigError } from '../services/eventTimesApi'
import {
  clearAllUserActions,
  getAllUserActions,
} from '../services/userActionService'
import type { EventAction, VenueAction } from '../services/userActionService'
import {
  defaultUserPreferences,
  getUserProfileSettings,
  saveUsernameToProfile,
  saveUserProfileSettings,
} from '../services/userProfileService'
import type { UserProfileSettings } from '../services/userProfileService'
import {
  registerUsername,
  UsernameTakenError,
} from '../services/usernameService'
import {
  getAllEventMemories,
} from '../services/memoryService'
import type { EventMemory } from '../services/memoryService'
import { formatEventDate } from '../utils/eventStatus'
import {
  isValidUsername,
  normalizeUsername,
  USERNAME_RULES_MESSAGE,
} from '../utils/username'
import { formatVenueAddress, getVenueDisplayName } from '../utils/venueDisplay'
import { TiltCard } from './TiltCard'

type AccountPanelProps = {
  venues: Venue[]
  events: EventTimesEvent[]
  onVenueSelect: (venue: Venue) => void
  onEventSelect: (event: EventTimesEvent, venue: Venue) => void
  onClose: () => void
}

type AccountActivityItem = {
  id: string
  meta: string
  title: string
  onClick?: () => void
}

type RecentActivityItem = {
  id: string
  label: string
  meta: string
  occurredAtMs: number | null
  title: string
  onClick?: () => void
}

type CollectionKey = 'visited' | 'going' | 'savedEvents' | 'savedVenues'

const recentActivityLimit = 5
const eventPreferenceOptions = EVENT_TYPES.filter((eventType) => eventType !== 'Wszystkie')
const cityOptions = ['Leszno']

const fallbackProfileSettings: UserProfileSettings = {
  profileSetupCompleted: false,
  username: null,
  userPreferences: defaultUserPreferences,
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function toggleEventTypeSelection(eventTypes: string[], eventType: string) {
  return eventTypes.includes(eventType)
    ? eventTypes.filter((candidate) => candidate !== eventType)
    : [...eventTypes, eventType]
}

function getActionUpdatedAtMs(value: unknown) {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime()
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const timestamp = new Date(value).getTime()
    return Number.isNaN(timestamp) ? null : timestamp
  }

  if (typeof value === 'object') {
    const maybeTimestamp = value as {
      nanoseconds?: unknown
      seconds?: unknown
      toDate?: unknown
    }

    if (typeof maybeTimestamp.toDate === 'function') {
      const date = maybeTimestamp.toDate()
      return date instanceof Date && !Number.isNaN(date.getTime())
        ? date.getTime()
        : null
    }

    if (typeof maybeTimestamp.seconds === 'number') {
      const nanoseconds = typeof maybeTimestamp.nanoseconds === 'number'
        ? maybeTimestamp.nanoseconds
        : 0

      return (maybeTimestamp.seconds * 1000) + Math.floor(nanoseconds / 1000000)
    }
  }

  return null
}

function formatActivityDate(timestampMs: number | null) {
  if (timestampMs === null) {
    return 'Brak daty aktywności'
  }

  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(timestampMs))
}

function getPrimaryEventActivity(action: EventAction) {
  if (action.visited) {
    return 'visited' as const
  }

  if (action.going) {
    return 'going' as const
  }

  if (action.saved) {
    return 'saved' as const
  }

  return null
}

function getEventActivityLabel(activity: NonNullable<ReturnType<typeof getPrimaryEventActivity>>) {
  switch (activity) {
    case 'visited':
      return 'Oznaczono jako „Byłem”'
    case 'going':
      return 'Dodano do „Chcę iść”'
    case 'saved':
      return 'Polubiono wydarzenie'
  }
}

function formatPhotoCount(count: number) {
  if (count === 1) {
    return '1 zdjęcie'
  }

  if (count >= 2 && count <= 4) {
    return `${count} zdjęcia`
  }

  return `${count} zdjęć`
}

export function AccountPanel({
  venues,
  events,
  onVenueSelect,
  onEventSelect,
  onClose,
}: AccountPanelProps) {
  const {
    user,
    isAdmin,
    linkPassword,
    linkProvider,
    unlinkProvider,
    updateProfile,
    logout,
  } = useAuth()
  const [eventActions, setEventActions] = useState<EventAction[]>([])
  const [venueActions, setVenueActions] = useState<VenueAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [methodsError, setMethodsError] = useState('')
  const [methodsStatus, setMethodsStatus] = useState('')
  const [methodsBusy, setMethodsBusy] = useState(false)
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [isUsernameFormOpen, setIsUsernameFormOpen] = useState(false)
  const [usernameValue, setUsernameValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? '')
  const [profileSettings, setProfileSettings] = useState<UserProfileSettings>(fallbackProfileSettings)
  const [profileDefaultCity, setProfileDefaultCity] = useState(defaultUserPreferences.defaultCity)
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [setupDefaultCity, setSetupDefaultCity] = useState(defaultUserPreferences.defaultCity)
  const [setupEventTypes, setSetupEventTypes] = useState<string[]>([])
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingSetup, setSavingSetup] = useState(false)
  const [clearingData, setClearingData] = useState(false)
  const [memories, setMemories] = useState<EventMemory[]>([])
  const [activeCollection, setActiveCollection] = useState<CollectionKey>('visited')
  const eventById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  )
  const venueById = useMemo(
    () => new Map(venues.map((venue) => [venue.id, venue])),
    [venues],
  )

  useEffect(() => {
    if (!user) {
      return
    }

    let active = true
    setLoading(true)
    setError('')

    void Promise.all([
      getAllUserActions(user.uid),
      getUserProfileSettings(user.uid),
      getAllEventMemories(user.uid),
    ])
      .then(([actions, settings, loadedMemories]) => {
        if (active) {
          setEventActions(actions.eventActions)
          setVenueActions(actions.venueActions)
          setProfileSettings(settings)
          setMemories(loadedMemories)
          setProfileDefaultCity(settings.userPreferences.defaultCity)
          setSelectedEventTypes(settings.userPreferences.eventTypes)
          setSetupDefaultCity(settings.userPreferences.defaultCity)
          setSetupEventTypes(settings.userPreferences.eventTypes)
          setIsSetupOpen(!settings.profileSetupCompleted)
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Nie udało się pobrać aktywności.')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const isMobile = useMediaQuery(MOBILE_PANEL_MEDIA_QUERY)
  // Mobilna strona 1: Karnet startuje na cały ekran; lekki swipe w górę
  // (scroll) wysuwa z dołu przyciski i skraca kartę.
  const [passRevealed, setPassRevealed] = useState(false)

  if (!user) {
    return null
  }

  const currentUser = user
  const linkedMethods = getLinkedMethods(currentUser)
  const linkedMethodCount = [
    linkedMethods.google,
    linkedMethods.github,
    linkedMethods.password,
  ].filter(Boolean).length

  const savedEvents = eventActions.filter((action) => action.saved)
  const goingEvents = eventActions.filter((action) => action.going)
  const visitedEvents = eventActions.filter((action) => action.visited)
  const savedVenues = venueActions.filter((action) => action.saved)
  const googlePhotoURL = currentUser.providerData.find(
    (provider) => provider.providerId === 'google.com',
  )?.photoURL
  const avatarURL = currentUser.photoURL || googlePhotoURL
  const initial = (currentUser.displayName ?? currentUser.email ?? 'U').charAt(0).toLocaleUpperCase('pl-PL')

  function startEditing() {
    setDisplayName(currentUser.displayName ?? '')
    setPhotoURL(currentUser.photoURL ?? googlePhotoURL ?? '')
    setProfileDefaultCity(profileSettings.userPreferences.defaultCity)
    setSelectedEventTypes(profileSettings.userPreferences.eventTypes)
    setError('')
    setSuccessMessage('')
    setIsEditing(true)
  }

  function cancelEditing() {
    setDisplayName(currentUser.displayName ?? '')
    setPhotoURL(currentUser.photoURL ?? googlePhotoURL ?? '')
    setProfileDefaultCity(profileSettings.userPreferences.defaultCity)
    setSelectedEventTypes(profileSettings.userPreferences.eventTypes)
    setError('')
    setIsEditing(false)
  }

  async function handleProviderLink(providerId: 'google' | 'github') {
    const label = oauthProviderLabels[providerId]

    setMethodsBusy(true)
    setMethodsError('')
    setMethodsStatus('')

    try {
      await linkProvider(providerId)
      setMethodsStatus(`Połączono ${label}.`)
    } catch (providerError) {
      setMethodsError(getAuthErrorMessage(providerError))
    } finally {
      setMethodsBusy(false)
    }
  }

  async function handleMethodUnlink(method: 'google' | 'github' | 'password') {
    const label = method === 'password' ? 'hasło' : oauthProviderLabels[method]

    setMethodsBusy(true)
    setMethodsError('')
    setMethodsStatus('')

    try {
      await unlinkProvider(method)
      setMethodsStatus(`Odłączono ${label}.`)
    } catch (unlinkError) {
      setMethodsError(getAuthErrorMessage(unlinkError))
    } finally {
      setMethodsBusy(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (methodsBusy) {
      return
    }

    if (passwordValue.length < 8) {
      setMethodsError('Hasło musi mieć co najmniej 8 znaków.')
      setMethodsStatus('')
      return
    }

    if (passwordValue !== passwordRepeat) {
      setMethodsError('Hasła muszą być takie same.')
      setMethodsStatus('')
      return
    }

    setMethodsBusy(true)
    setMethodsError('')
    setMethodsStatus('')

    try {
      await linkPassword(passwordValue)
      setPasswordValue('')
      setPasswordRepeat('')
      setIsPasswordFormOpen(false)
      setMethodsStatus('Hasło ustawione. Możesz logować się e-mailem i hasłem.')
    } catch (passwordError) {
      setMethodsError(getAuthErrorMessage(passwordError))
    } finally {
      setMethodsBusy(false)
    }
  }

  function openUsernameForm() {
    setUsernameValue(profileSettings.username ?? '')
    setMethodsError('')
    setMethodsStatus('')
    setIsUsernameFormOpen(true)
  }

  async function handleUsernameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (methodsBusy) {
      return
    }

    const normalizedUsername = normalizeUsername(usernameValue)

    if (!isValidUsername(normalizedUsername)) {
      setMethodsError(USERNAME_RULES_MESSAGE)
      setMethodsStatus('')
      return
    }

    setMethodsBusy(true)
    setMethodsError('')
    setMethodsStatus('')

    try {
      const idToken = await currentUser.getIdToken()
      const savedUsername = await registerUsername(idToken, normalizedUsername)
      await saveUsernameToProfile(currentUser.uid, savedUsername)
      setProfileSettings((settings) => ({
        ...settings,
        username: savedUsername,
      }))
      setUsernameValue(savedUsername)
      setIsUsernameFormOpen(false)
      setMethodsStatus('Zapisano nazwę użytkownika. Możesz jej używać do logowania.')
    } catch (usernameError) {
      if (usernameError instanceof UsernameTakenError) {
        setMethodsError(usernameError.message)
      } else if (usernameError instanceof EventTimesApiConfigError) {
        setMethodsError('Funkcja nazwy użytkownika jest chwilowo niedostępna.')
      } else {
        setMethodsError('Nie udało się zapisać nazwy użytkownika.')
      }
    } finally {
      setMethodsBusy(false)
    }
  }

  async function saveProfile() {
    const normalizedName = displayName.trim()
    const normalizedPhotoURL = photoURL.trim()

    if (!normalizedName) {
      setError('Nazwa użytkownika nie może być pusta.')
      return
    }

    if (normalizedName.length > 32) {
      setError('Nazwa użytkownika może mieć maksymalnie 32 znaki.')
      return
    }

    if (normalizedPhotoURL && !isValidHttpUrl(normalizedPhotoURL)) {
      setError('Link do zdjęcia musi zaczynać się od http:// albo https://.')
      return
    }

    setSavingProfile(true)
    setError('')

    try {
      const [, savedSettings] = await Promise.all([
        updateProfile(
          normalizedName,
          normalizedPhotoURL || googlePhotoURL || null,
        ),
        saveUserProfileSettings(
          currentUser.uid,
          {
            defaultCity: profileDefaultCity,
            eventTypes: selectedEventTypes,
          },
          true,
        ),
      ])
      setProfileSettings((settings) => ({
        ...savedSettings,
        username: settings.username,
      }))
      setSetupDefaultCity(savedSettings.userPreferences.defaultCity)
      setSetupEventTypes(savedSettings.userPreferences.eventTypes)
      setIsSetupOpen(false)
      setSuccessMessage('Profil został zaktualizowany.')
      setIsEditing(false)
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Nie udało się zapisać profilu.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveSetupPreferences() {
    setSavingSetup(true)
    setError('')

    try {
      const savedSettings = await saveUserProfileSettings(
        currentUser.uid,
        {
          defaultCity: setupDefaultCity,
          eventTypes: setupEventTypes,
        },
        true,
      )
      setProfileSettings((settings) => ({
        ...savedSettings,
        username: settings.username,
      }))
      setProfileDefaultCity(savedSettings.userPreferences.defaultCity)
      setSelectedEventTypes(savedSettings.userPreferences.eventTypes)
      setIsSetupOpen(false)
      setSuccessMessage('Preferencje zostały zapisane.')
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : 'Nie udało się zapisać preferencji.')
    } finally {
      setSavingSetup(false)
    }
  }

  async function skipSetup() {
    setSavingSetup(true)
    setError('')

    try {
      const savedSettings = await saveUserProfileSettings(
        currentUser.uid,
        profileSettings.userPreferences,
        true,
      )
      setProfileSettings((settings) => ({
        ...savedSettings,
        username: settings.username,
      }))
      setSetupDefaultCity(savedSettings.userPreferences.defaultCity)
      setSetupEventTypes(savedSettings.userPreferences.eventTypes)
      setIsSetupOpen(false)
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : 'Nie udało się pominąć konfiguracji profilu.')
    } finally {
      setSavingSetup(false)
    }
  }

  async function clearUserData() {
    const confirmed = window.confirm(
      'Czy na pewno chcesz usunąć wszystkie swoje polubione miejsca, polubione wydarzenia i aktywności? Tej operacji nie można cofnąć.',
    )

    if (!confirmed) {
      return
    }

    setClearingData(true)
    setError('')
    setSuccessMessage('')

    try {
      await clearAllUserActions(currentUser.uid)
      setEventActions([])
      setVenueActions([])
      setSuccessMessage('Polubione i aktywności zostały wyczyszczone.')
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : 'Nie udało się wyczyścić aktywności.')
    } finally {
      setClearingData(false)
    }
  }

  async function handleLogout() {
    setError('')

    try {
      await logout()
      onClose()
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Nie udało się wylogować.')
    }
  }

  function getEventActivityItems(actions: EventAction[]): AccountActivityItem[] {
    return actions.map((action) => {
      const event = eventById.get(action.eventId)
      const venue = event ? venueById.get(event.venueId) : undefined

      if (!event || !venue) {
        return {
          id: action.eventId,
          meta: action.eventId,
          title: 'Element niedostępny',
        }
      }

      return {
        id: action.eventId,
        meta: `${formatEventDate(event.startDate)} · ${getVenueDisplayName(venue)}`,
        title: event.name,
        onClick: () => onEventSelect(event, venue),
      }
    })
  }

  function getVenueActivityItems(actions: VenueAction[]): AccountActivityItem[] {
    return actions.map((action) => {
      const venue = venueById.get(action.venueId)

      if (!venue) {
        return {
          id: action.venueId,
          meta: action.venueId,
          title: 'Element niedostępny',
        }
      }

      return {
        id: action.venueId,
        meta: formatVenueAddress(venue),
        title: getVenueDisplayName(venue),
        onClick: () => onVenueSelect(venue),
      }
    })
  }

  function getRecentActivityItems(): RecentActivityItem[] {
    const eventActivityItems = eventActions.flatMap((action) => {
      const activity = getPrimaryEventActivity(action)
      const event = eventById.get(action.eventId)
      const venue = event ? venueById.get(event.venueId) : undefined

      if (!activity || !event || !venue) {
        return []
      }

      const occurredAtMs = getActionUpdatedAtMs(action.updatedAt)

      return [{
        id: `event-${action.eventId}`,
        label: getEventActivityLabel(activity),
        meta: `${formatActivityDate(occurredAtMs)} · ${getVenueDisplayName(venue)}`,
        occurredAtMs,
        title: event.name,
        onClick: () => onEventSelect(event, venue),
      }]
    })
    const venueActivityItems = venueActions.flatMap((action) => {
      const venue = venueById.get(action.venueId)

      if (!action.saved || !venue) {
        return []
      }

      const occurredAtMs = getActionUpdatedAtMs(action.updatedAt)

      return [{
        id: `venue-${action.venueId}`,
        label: 'Polubiono miejsce',
        meta: `${formatActivityDate(occurredAtMs)} · ${formatVenueAddress(venue)}`,
        occurredAtMs,
        title: getVenueDisplayName(venue),
        onClick: () => onVenueSelect(venue),
      }]
    })

    return [...eventActivityItems, ...venueActivityItems]
      .sort((first, second) => (second.occurredAtMs ?? 0) - (first.occurredAtMs ?? 0))
      .slice(0, recentActivityLimit)
  }

  function getSortedMemories() {
    return [...memories].sort((first, second) => {
      const firstUpdatedAt = getActionUpdatedAtMs(first.updatedAt) ?? getActionUpdatedAtMs(first.createdAt) ?? 0
      const secondUpdatedAt = getActionUpdatedAtMs(second.updatedAt) ?? getActionUpdatedAtMs(second.createdAt) ?? 0

      return secondUpdatedAt - firstUpdatedAt
    })
  }

  function renderMemoriesSection(sortedMemories: EventMemory[]) {
    return (
      <section className="account-shelf" aria-labelledby="account-memories-title">
        <header className="account-shelf-header">
          <h3 id="account-memories-title">Wspomnienia</h3>
          <span className="account-private-sticker">prywatne</span>
          <strong className="account-shelf-count">{sortedMemories.length}</strong>
        </header>

        {sortedMemories.length ? (
          <ul className="account-polaroid-strip">
            {sortedMemories.map((memory) => {
              const event = eventById.get(memory.eventId)
              const venue = event ? venueById.get(event.venueId) : undefined
              const firstPhoto = memory.photos[0]
              const meta = event
                ? `${formatEventDate(event.startDate)} · ${formatPhotoCount(memory.photos.length)}`
                : formatPhotoCount(memory.photos.length)
              const content = (
                <>
                  <span className="account-polaroid-photo" aria-hidden="true">
                    {firstPhoto ? (
                      <img src={firstPhoto.url} alt="" />
                    ) : (
                      <Image className="ui-icon" aria-hidden="true" />
                    )}
                  </span>
                  <span className="account-polaroid-caption">
                    {event ? event.name : 'Wydarzenie usunięte'}
                  </span>
                  <span className="account-polaroid-meta">{meta}</span>
                </>
              )

              return (
                <li key={memory.eventId}>
                  {event && venue ? (
                    <button
                      className="account-polaroid"
                      type="button"
                      onClick={() => onEventSelect(event, venue)}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="account-polaroid is-disabled" aria-disabled="true">
                      {content}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="account-empty">
            Zaznacz Byłem na minionym wydarzeniu i dodaj zdjęcia lub notatkę — pojawią się tutaj jak odbitki z wydarzeń.
          </p>
        )}
      </section>
    )
  }

  function renderPreferenceControls(
    idPrefix: string,
    selectedTypes: string[],
    onTypeToggle: (eventType: string) => void,
    city: string,
    onCityChange: (city: string) => void,
  ) {
    return (
      <div className="account-preferences-fields">
        <label className="account-city-field">
          <span>Domyślne miasto</span>
          <select value={city} onChange={(event) => onCityChange(event.target.value)}>
            {cityOptions.map((cityOption) => (
              <option key={cityOption} value={cityOption}>{cityOption}</option>
            ))}
          </select>
        </label>

        <fieldset className="account-preference-group">
          <legend>Preferencje wydarzeń</legend>
          <div className="account-preference-chips">
            {eventPreferenceOptions.map((eventType) => {
              const selected = selectedTypes.includes(eventType)

              return (
                <button
                  key={`${idPrefix}-${eventType}`}
                  className={`account-preference-chip${selected ? ' is-selected' : ''}`}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onTypeToggle(eventType)}
                >
                  {eventType}
                </button>
              )
            })}
          </div>
        </fieldset>
      </div>
    )
  }

  function renderRecentActivity(items: RecentActivityItem[]) {
    return (
      <section className="account-shelf" aria-labelledby="account-recent-activity-title">
        <header className="account-shelf-header">
          <h3 id="account-recent-activity-title">Ostatnia aktywność</h3>
          <Clock className="ui-icon account-shelf-icon" aria-hidden="true" />
        </header>

        {items.length ? (
          <ol className="account-receipt">
            {items.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={item.onClick}>
                  <span className="account-receipt-label">{item.label}</span>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="account-empty">Twoje ostatnie działania pojawią się tutaj.</p>
        )}
      </section>
    )
  }

  function renderCollectionList(items: AccountActivityItem[], emptyCopy: string) {
    if (!items.length) {
      return <p className="account-empty">{emptyCopy}</p>
    }

    return (
      <ul className="account-collection-list">
        {items.map((item) => (
          <li key={item.id}>
            {item.onClick ? (
              <button className="account-collection-item" type="button" onClick={item.onClick}>
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </button>
            ) : (
              <div className="account-collection-item is-disabled" aria-disabled="true">
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    )
  }

  const savedEventItems = getEventActivityItems(savedEvents)
  const goingEventItems = getEventActivityItems(goingEvents)
  const visitedEventItems = getEventActivityItems(visitedEvents)
  const savedVenueItems = getVenueActivityItems(savedVenues)
  const recentActivityItems = getRecentActivityItems()
  const sortedMemories = getSortedMemories()
  const collections: Array<{
    key: CollectionKey
    label: string
    items: AccountActivityItem[]
    emptyCopy: string
  }> = [
    {
      key: 'visited',
      label: 'Byłem',
      items: visitedEventItems,
      emptyCopy: 'Oznacz „Byłem” na minionym wydarzeniu, a trafi do tej kolekcji.',
    },
    {
      key: 'going',
      label: 'Chcę iść',
      items: goingEventItems,
      emptyCopy: 'Zaznacz „Chcę iść” przy nadchodzącym wydarzeniu — zbudujesz tu swój plan.',
    },
    {
      key: 'savedEvents',
      label: 'Wydarzenia',
      items: savedEventItems,
      emptyCopy: 'Polub wydarzenie serduszkiem, żeby je tu zapisać.',
    },
    {
      key: 'savedVenues',
      label: 'Miejsca',
      items: savedVenueItems,
      emptyCopy: 'Polub miejsce, żeby mieć je zawsze pod ręką.',
    },
  ]
  const activeCollectionConfig =
    collections.find((collection) => collection.key === activeCollection) ?? collections[0]
  const passYear = new Date().getFullYear()
  const setupPanelNode = isSetupOpen ? (
    <section className="account-setup-panel" aria-labelledby="account-setup-title">
      <div className="account-setup-copy">
        <span>
          <SlidersHorizontal className="ui-icon" aria-hidden="true" />
          Pierwsza konfiguracja
        </span>
        <h2 id="account-setup-title">Dostosuj Event Times</h2>
        <p>Ustaw domyślne miasto i typy wydarzeń, które chcesz szybciej odnajdywać.</p>
      </div>

      {renderPreferenceControls(
        'setup',
        setupEventTypes,
        (eventType) => setSetupEventTypes((currentTypes) => toggleEventTypeSelection(currentTypes, eventType)),
        setupDefaultCity,
        setSetupDefaultCity,
      )}

      <div className="account-setup-actions">
        <button className="button button-primary" type="button" disabled={savingSetup} onClick={() => void saveSetupPreferences()}>
          {savingSetup ? 'Zapisywanie…' : 'Zapisz preferencje'}
        </button>
        <button className="button button-secondary" type="button" disabled={savingSetup} onClick={() => void skipSetup()}>
          Pomiń na razie
        </button>
      </div>
    </section>
  ) : null
  const passCardNode = (
    <TiltCard>
      <div className="account-pass-card">
        <span className="account-pass-brand" aria-hidden="true">Event Times</span>
        <div className="account-pass-head">
          <div className="account-pass-photo" aria-hidden="true">
            {avatarURL ? (
              <img src={avatarURL} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="account-pass-initial">{initial}</span>
            )}
          </div>
          <div className="account-pass-identity">
            <span className="account-pass-kicker">Karnet uczestnika</span>
            <h1 id="account-panel-title">
              {currentUser.displayName ?? currentUser.email ?? 'Użytkownik Event Times'}
            </h1>
            <p className="account-pass-email">{currentUser.email}</p>
          </div>
        </div>
        <div className="account-role-row">
          <span className="account-role-pill">{isAdmin ? 'Administrator' : 'Użytkownik'}</span>
          {isAdmin && <span className="account-admin-badge">Panel admina</span>}
        </div>

        <div className="account-pass-footer" aria-hidden="true">
          <span className="account-pass-barcode" />
          <span className="account-pass-serial">Event Times &middot; {passYear}</span>
        </div>
      </div>
    </TiltCard>
  )
  const quickActionsNode = (
    <div className="account-quick-actions" aria-label="Szybkie akcje profilu">
      <button type="button" onClick={startEditing} disabled={isEditing}>
        <Pencil className="ui-icon" aria-hidden="true" />
        Edytuj profil
      </button>
      <button type="button" onClick={() => void handleLogout()}>
        <LogOut className="ui-icon" aria-hidden="true" />
        Wyloguj
      </button>
    </div>
  )
  const loginMethodsNode = (
    <section className="account-login-methods" aria-labelledby="login-methods-title">
      <h2 id="login-methods-title">Metody logowania</h2>

      <ul className="account-login-method-list">
        <li className="account-login-method-row">
          <div className="account-login-method-copy">
            <strong>Google</strong>
            <span className={`account-login-method-status${linkedMethods.google ? ' is-linked' : ''}`}>
              {linkedMethods.google ? 'Połączone' : 'Niepołączone'}
            </span>
          </div>
          {!linkedMethods.google ? (
            <button
              type="button"
              disabled={methodsBusy}
              onClick={() => void handleProviderLink('google')}
            >
              {methodsBusy ? 'Łączenie…' : 'Połącz'}
            </button>
          ) : linkedMethodCount > 1 ? (
            <button
              type="button"
              disabled={methodsBusy}
              onClick={() => void handleMethodUnlink('google')}
            >
              {methodsBusy ? 'Zapisywanie…' : 'Odłącz'}
            </button>
          ) : null}
        </li>

        <li className="account-login-method-row">
          <div className="account-login-method-copy">
            <strong>GitHub</strong>
            <span className={`account-login-method-status${linkedMethods.github ? ' is-linked' : ''}`}>
              {linkedMethods.github ? 'Połączone' : 'Niepołączone'}
            </span>
          </div>
          {!linkedMethods.github ? (
            <button
              type="button"
              disabled={methodsBusy}
              onClick={() => void handleProviderLink('github')}
            >
              {methodsBusy ? 'Łączenie…' : 'Połącz'}
            </button>
          ) : linkedMethodCount > 1 ? (
            <button
              type="button"
              disabled={methodsBusy}
              onClick={() => void handleMethodUnlink('github')}
            >
              {methodsBusy ? 'Zapisywanie…' : 'Odłącz'}
            </button>
          ) : null}
        </li>

        <li className="account-login-method-row">
          <div className="account-login-method-copy">
            <strong>Hasło</strong>
            <span className={`account-login-method-status${linkedMethods.password ? ' is-linked' : ''}`}>
              {linkedMethods.password ? 'Ustawione' : 'Nieustawione'}
            </span>
            {linkedMethods.password && (
              <small>Zmiana hasła: użyj „Nie pamiętam hasła” na ekranie logowania.</small>
            )}
          </div>
          {!linkedMethods.password ? (
            <button
              type="button"
              disabled={methodsBusy || isPasswordFormOpen}
              onClick={() => {
                setMethodsError('')
                setMethodsStatus('')
                setIsPasswordFormOpen(true)
              }}
            >
              Ustaw hasło
            </button>
          ) : linkedMethodCount > 1 ? (
            <button
              type="button"
              disabled={methodsBusy}
              onClick={() => void handleMethodUnlink('password')}
            >
              {methodsBusy ? 'Zapisywanie…' : 'Odłącz'}
            </button>
          ) : null}
        </li>
      </ul>

      {isPasswordFormOpen && (
        <form className="account-inline-form" onSubmit={(event) => void handlePasswordSubmit(event)}>
          <label>
            <span>Nowe hasło</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={passwordValue}
              onChange={(event) => setPasswordValue(event.target.value)}
            />
          </label>
          <label>
            <span>Powtórz hasło</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={passwordRepeat}
              onChange={(event) => setPasswordRepeat(event.target.value)}
            />
          </label>
          <div className="account-inline-actions">
            <button type="submit" disabled={methodsBusy}>
              {methodsBusy ? 'Zapisywanie…' : 'Zapisz hasło'}
            </button>
            <button
              type="button"
              disabled={methodsBusy}
              onClick={() => {
                setPasswordValue('')
                setPasswordRepeat('')
                setIsPasswordFormOpen(false)
                setMethodsError('')
              }}
            >
              Anuluj
            </button>
          </div>
        </form>
      )}

      <div className="account-username-section">
        <div className="account-username-head">
          <div>
            <h3>Nazwa użytkownika</h3>
            <p>
              Aktualna nazwa:{' '}
              <strong>{profileSettings.username ?? 'Nieustawiona'}</strong>
            </p>
          </div>
          <button type="button" disabled={methodsBusy} onClick={openUsernameForm}>
            {profileSettings.username ? 'Zmień nazwę' : 'Ustaw nazwę'}
          </button>
        </div>

        {isUsernameFormOpen && (
          <form className="account-inline-form" onSubmit={(event) => void handleUsernameSubmit(event)}>
            <label>
              <span>Nazwa użytkownika</span>
              <input
                maxLength={20}
                autoComplete="off"
                value={usernameValue}
                onChange={(event) => setUsernameValue(event.target.value)}
              />
            </label>
            <small>{USERNAME_RULES_MESSAGE}</small>
            {!linkedMethods.password && (
              <small>Logowanie nazwą użytkownika działa z hasłem — ustaw też hasło powyżej.</small>
            )}
            <div className="account-inline-actions">
              <button type="submit" disabled={methodsBusy}>
                {methodsBusy ? 'Zapisywanie…' : 'Zapisz'}
              </button>
              <button
                type="button"
                disabled={methodsBusy}
                onClick={() => {
                  setUsernameValue(profileSettings.username ?? '')
                  setIsUsernameFormOpen(false)
                  setMethodsError('')
                }}
              >
                Anuluj
              </button>
            </div>
          </form>
        )}
      </div>

      {methodsError && <p className="account-methods-error" role="alert">{methodsError}</p>}
      {methodsStatus && <p className="account-methods-success" role="status">{methodsStatus}</p>}
    </section>
  )
  const editFormNode = isEditing ? (
    <section className="account-profile-edit" aria-labelledby="profile-edit-title">
      <div className="account-section-heading">
        <h2 id="profile-edit-title">Edycja profilu</h2>
      </div>

      <div className="account-profile-form">
        <label>
          <span>Nazwa użytkownika</span>
          <input
            maxLength={32}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label>
          <span>Link do zdjęcia profilowego</span>
          <input
            type="url"
            placeholder="https://"
            value={photoURL}
            onChange={(event) => setPhotoURL(event.target.value)}
          />
        </label>
        <small>Zdjęcie jest ustawiane wyłącznie przez link URL. Pliki nie są wysyłane.</small>
        <section className="account-edit-preferences" aria-labelledby="account-edit-preferences-title">
          <h3 id="account-edit-preferences-title">Preferencje wydarzeń</h3>
          <p>Wybierz typy wydarzeń, które najbardziej Cię interesują.</p>
          {renderPreferenceControls(
            'edit',
            selectedEventTypes,
            (eventType) => setSelectedEventTypes((currentTypes) => toggleEventTypeSelection(currentTypes, eventType)),
            profileDefaultCity,
            setProfileDefaultCity,
          )}
        </section>
        <div className="account-profile-form-actions">
          <button
            className="button button-primary"
            type="button"
            disabled={savingProfile}
            onClick={() => void saveProfile()}
          >
            {savingProfile ? 'Zapisywanie…' : 'Zapisz profil'}
          </button>
          <button className="button button-secondary" type="button" disabled={savingProfile} onClick={cancelEditing}>
            Anuluj
          </button>
        </div>
      </div>
      {isMobile ? loginMethodsNode : null}
    </section>
  ) : null
  const feedbackNode = (
    <>
      {error && <p className="account-error" role="alert">{error}</p>}
      {successMessage && <p className="account-success" role="status">{successMessage}</p>}
    </>
  )
  const clearDataNode = (
    <section className="account-clear-data" aria-labelledby="clear-data-title">
      <h2 id="clear-data-title">Wyczyść aktywność</h2>
      <p>Usuwa polubione i aktywności. Konto oraz profil pozostaną bez zmian.</p>
      <button type="button" disabled={clearingData} onClick={() => void clearUserData()}>
        <Trash2 className="ui-icon" aria-hidden="true" />
        {clearingData ? 'Czyszczenie…' : 'Wyczyść aktywności'}
      </button>
    </section>
  )
  const collectionHeaderNode = (
    <header className="account-collection-header">
      <span>Moja kolekcja</span>
      <h2 id="account-collection-title">Twoje wydarzenia</h2>
    </header>
  )
  const statStripNode = (
    <div className="account-stat-strip" role="group" aria-label="Kolekcje aktywności">
      {collections.map((collection) => (
        <button
          key={collection.key}
          className={`account-stat${
            activeCollection === collection.key ? ' is-active' : ''
          }`}
          type="button"
          aria-pressed={activeCollection === collection.key}
          onClick={() => setActiveCollection(collection.key)}
        >
          <strong>{collection.items.length}</strong>
          <span>{collection.label}</span>
        </button>
      ))}
    </div>
  )
  const collectionListNode = renderCollectionList(activeCollectionConfig.items, activeCollectionConfig.emptyCopy)
  const memoriesNode = renderMemoriesSection(sortedMemories)
  const activityNode = renderRecentActivity(recentActivityItems)
  const loadingNode = <p className="account-loading" role="status">Ładowanie aktywności…</p>

  return (
    <div className="account-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="account-panel"
        aria-labelledby="account-panel-title"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="account-panel-close"
          type="button"
          onClick={onClose}
          aria-label="Zamknij panel profilu"
        >
          <X className="ui-icon" aria-hidden="true" />
        </button>

        {!isMobile ? (
          <div className="account-profile-layout">
            {setupPanelNode}
            <section className="account-pass" aria-labelledby="account-panel-title">
              {passCardNode}
              {quickActionsNode}
              {editFormNode}
              {feedbackNode}
              {loginMethodsNode}
              {clearDataNode}
            </section>
            <section className="account-collection" aria-labelledby="account-collection-title">
              {collectionHeaderNode}
              {loading ? loadingNode : (<>{statStripNode}{collectionListNode}{memoriesNode}{activityNode}</>)}
            </section>
          </div>
        ) : (
          <div className="account-profile-layout account-profile-layout--mobile">
            {setupPanelNode}
            <div className="account-pager" role="group" aria-label="Sekcje profilu">
              <section
                className={`account-page account-page--pass${passRevealed ? ' is-revealed' : ''}`}
                aria-labelledby="account-panel-title"
                onScroll={(event) => setPassRevealed(event.currentTarget.scrollTop > 8)}
              >
                {passCardNode}
                {quickActionsNode}
                {editFormNode}
                {feedbackNode}
                {clearDataNode}
              </section>
              <section className="account-page account-page--memories" aria-label="Wspomnienia">
                {loading ? loadingNode : memoriesNode}
              </section>
              <section className="account-page account-page--collection" aria-labelledby="account-collection-title">
                {collectionHeaderNode}
                {loading ? loadingNode : (<>{statStripNode}{collectionListNode}{activityNode}</>)}
              </section>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
