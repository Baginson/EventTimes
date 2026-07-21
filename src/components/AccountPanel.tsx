import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  PointerEvent as ReactPointerEvent,
  UIEvent as ReactUIEvent,
} from 'react'
import type { FormEvent } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
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
  CLOUDINARY_UPLOADS_ENABLED,
  uploadImageToCloudinary,
} from '../services/cloudinaryService'
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

const recentActivityLimit = 3
const accountPagerPages = ['Karnet', 'Wspomnienia', 'Kolekcja i aktywność']
const eventPreferenceOptions = EVENT_TYPES.filter((eventType) => eventType !== 'Wszystkie')
const cityOptions = ['Leszno']
const PASS_SWIPE_AXIS_LOCK_PX = 6
const PASS_SWIPE_REVEAL_PX = 40
const PAGER_CLOSE_OFFSET_PX = 120
const PAGER_CLOSE_VELOCITY_PX_MS = 0.5

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
    sendVerificationEmail,
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
  const [isEditing, setIsEditing] = useState(false)
  const [usernameValue, setUsernameValue] = useState(user?.displayName ?? '')
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? '')
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [avatarUploadError, setAvatarUploadError] = useState('')
  const [isSendingVerification, setIsSendingVerification] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState('')
  const [verificationError, setVerificationError] = useState('')
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
  const [isRecentActivityExpanded, setIsRecentActivityExpanded] = useState(false)
  const [activePagerPage, setActivePagerPage] = useState(0)
  const pagerRef = useRef<HTMLDivElement | null>(null)
  const cancelEditingRef = useRef<() => void>(() => {})
  const passSwipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const passSwipeAxisRef = useRef<'vertical' | 'horizontal' | null>(null)
  const pagerSwipeScrollTopAtStartRef = useRef(0)
  const passRevealedAtDragStartRef = useRef(false)
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
      if (event.key !== 'Escape') {
        return
      }

      if (isEditing) {
        cancelEditingRef.current()
      } else {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, isEditing])

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
    setUsernameValue(profileSettings.username ?? '')
    setDisplayName(currentUser.displayName ?? '')
    setPhotoURL(currentUser.photoURL ?? googlePhotoURL ?? '')
    setProfileDefaultCity(profileSettings.userPreferences.defaultCity)
    setSelectedEventTypes(profileSettings.userPreferences.eventTypes)
    setError('')
    setAvatarUploadError('')
    setVerificationError('')
    setVerificationStatus('')
    setSuccessMessage('')
    setIsEditing(true)
  }

  function isEditFormDirty() {
    return (
      displayName !== (currentUser.displayName ?? '') ||
      usernameValue !== (profileSettings.username ?? '') ||
      photoURL !== (currentUser.photoURL ?? googlePhotoURL ?? '') ||
      profileDefaultCity !== profileSettings.userPreferences.defaultCity ||
      JSON.stringify([...selectedEventTypes].sort()) !==
        JSON.stringify([...profileSettings.userPreferences.eventTypes].sort())
    )
  }

  function cancelEditing() {
    if (isEditFormDirty() && !window.confirm('Czy na pewno chcesz wyjść? Masz niezapisane zmiany.')) {
      return
    }

    setUsernameValue(profileSettings.username ?? '')
    setDisplayName(currentUser.displayName ?? '')
    setPhotoURL(currentUser.photoURL ?? googlePhotoURL ?? '')
    setProfileDefaultCity(profileSettings.userPreferences.defaultCity)
    setSelectedEventTypes(profileSettings.userPreferences.eventTypes)
    setError('')
    setAvatarUploadError('')
    setVerificationError('')
    setVerificationStatus('')
    setIsEditing(false)
  }

  cancelEditingRef.current = cancelEditing

  async function handleAvatarUpload(fileInput: HTMLInputElement) {
    const file = fileInput.files?.[0]

    if (!file) {
      return
    }

    try {
      setIsAvatarUploading(true)
      setAvatarUploadError('')
      const { url } = await uploadImageToCloudinary(file)
      setPhotoURL(url)
      fileInput.value = ''
    } catch (uploadError) {
      setAvatarUploadError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Nie udało się przesłać zdjęcia. Spróbuj ponownie.',
      )
    } finally {
      setIsAvatarUploading(false)
    }
  }

  async function handleSendVerificationEmail() {
    setIsSendingVerification(true)
    setVerificationError('')
    setVerificationStatus('')

    try {
      await sendVerificationEmail()
      setVerificationStatus('Wysłano link weryfikacyjny na Twój adres e-mail.')
    } catch (verificationErr) {
      setVerificationError(
        verificationErr instanceof Error
          ? verificationErr.message
          : 'Nie udało się wysłać linku weryfikacyjnego.',
      )
    } finally {
      setIsSendingVerification(false)
    }
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

  async function saveProfile() {
    const normalizedFullName = displayName.trim()
    const normalizedUsername = normalizeUsername(usernameValue)
    const normalizedPhotoURL = photoURL.trim()

    if (!isValidUsername(normalizedUsername)) {
      setError(USERNAME_RULES_MESSAGE)
      return
    }

    if (normalizedPhotoURL && !isValidHttpUrl(normalizedPhotoURL)) {
      setError('Link do zdjęcia musi zaczynać się od http:// albo https://.')
      return
    }

    setSavingProfile(true)
    setError('')

    try {
      if (normalizedUsername !== profileSettings.username) {
        const idToken = await currentUser.getIdToken()
        const savedUsername = await registerUsername(idToken, normalizedUsername)
        await saveUsernameToProfile(currentUser.uid, savedUsername)
      }

      const [, savedSettings] = await Promise.all([
        updateProfile(
          normalizedFullName || normalizedUsername,
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
      setProfileSettings({
        ...savedSettings,
        username: normalizedUsername,
      })
      setSetupDefaultCity(savedSettings.userPreferences.defaultCity)
      setSetupEventTypes(savedSettings.userPreferences.eventTypes)
      setIsSetupOpen(false)
      setSuccessMessage('Profil został zaktualizowany.')
      setIsEditing(false)
    } catch (profileError) {
      if (profileError instanceof UsernameTakenError) {
        setError(profileError.message)
      } else if (profileError instanceof EventTimesApiConfigError) {
        setError('Funkcja nazwy użytkownika jest chwilowo niedostępna. Spróbuj ponownie później.')
      } else {
        setError(profileError instanceof Error ? profileError.message : 'Nie udało się zapisać profilu.')
      }
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

  function getAccountPageElement(target: EventTarget | null): HTMLElement | null {
    return target instanceof HTMLElement ? target.closest('.account-page') : null
  }

  function handlePagerPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isEditing || isSetupOpen) {
      return
    }

    passSwipeStartRef.current = { x: event.clientX, y: event.clientY, time: Date.now() }
    passSwipeAxisRef.current = null
    pagerSwipeScrollTopAtStartRef.current = getAccountPageElement(event.target)?.scrollTop ?? 0
    passRevealedAtDragStartRef.current = passRevealed
  }

  function handlePagerPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = passSwipeStartRef.current

    if (!start || isEditing || isSetupOpen) {
      return
    }

    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y

    if (!passSwipeAxisRef.current) {
      if (
        Math.abs(deltaX) < PASS_SWIPE_AXIS_LOCK_PX &&
        Math.abs(deltaY) < PASS_SWIPE_AXIS_LOCK_PX
      ) {
        return
      }

      passSwipeAxisRef.current = Math.abs(deltaY) > Math.abs(deltaX)
        ? 'vertical'
        : 'horizontal'
    }

    if (passSwipeAxisRef.current !== 'vertical') {
      return
    }

    // Strona Karnetu ma własny gest: w górę odsłania przyciski, w dół chowa je z powrotem.
    // Dalsze ciągnięcie w dół (poniżej) zamyka cały panel, tak jak na pozostałych stronach.
    if (activePagerPage === 0) {
      if (deltaY < -PASS_SWIPE_REVEAL_PX) {
        setPassRevealed(true)
      } else if (deltaY > PASS_SWIPE_REVEAL_PX) {
        setPassRevealed(false)
      }
    }
  }

  function handlePagerPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const start = passSwipeStartRef.current
    const axis = passSwipeAxisRef.current

    if (start && axis === 'vertical' && !isEditing && !isSetupOpen) {
      const deltaY = event.clientY - start.y
      const elapsedMs = Math.max(1, Date.now() - start.time)
      const velocity = deltaY / elapsedMs

      // Karta musi być już zwinięta OD POCZĄTKU tego gestu — inaczej pierwszy
      // swipe w dół (który właśnie chował przyciski) zamykałby panel od razu.
      const canCloseFromPassPage = activePagerPage === 0 && !passRevealedAtDragStartRef.current
      const canCloseFromOtherPage =
        activePagerPage !== 0 && pagerSwipeScrollTopAtStartRef.current <= 0

      if (
        (canCloseFromPassPage || canCloseFromOtherPage) &&
        deltaY > 0 &&
        (deltaY > PAGER_CLOSE_OFFSET_PX || velocity > PAGER_CLOSE_VELOCITY_PX_MS)
      ) {
        onClose()
      }
    }

    passSwipeStartRef.current = null
    passSwipeAxisRef.current = null
  }

  function handlePagerScroll(event: ReactUIEvent<HTMLDivElement>) {
    const pager = event.currentTarget
    const pageWidth = pager.clientWidth

    if (pageWidth <= 0) {
      return
    }

    const index = Math.min(
      accountPagerPages.length - 1,
      Math.max(0, Math.round(pager.scrollLeft / pageWidth)),
    )

    setActivePagerPage((current) => (current === index ? current : index))
  }

  function scrollToPagerPage(index: number) {
    const pager = pagerRef.current

    if (!pager) {
      return
    }

    pager.scrollTo({ left: index * pager.clientWidth, behavior: 'smooth' })
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

  function renderRecentActivity(allItems: RecentActivityItem[]) {
    const hasMore = allItems.length > recentActivityLimit
    const items = isRecentActivityExpanded ? allItems : allItems.slice(0, recentActivityLimit)

    return (
      <section className="account-shelf" aria-labelledby="account-recent-activity-title">
        <header className="account-shelf-header">
          <h3 id="account-recent-activity-title">Ostatnia aktywność</h3>
          <Clock className="ui-icon account-shelf-icon" aria-hidden="true" />
        </header>

        {items.length ? (
          <>
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
            {hasMore && (
              <button
                className="account-shelf-toggle"
                type="button"
                onClick={() => setIsRecentActivityExpanded((expanded) => !expanded)}
              >
                {isRecentActivityExpanded ? 'Zwiń aktywność' : 'Pokaż całą aktywność'}
              </button>
            )}
          </>
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
  const memberSinceLabel = currentUser.metadata.creationTime
    ? new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(
        new Date(currentUser.metadata.creationTime),
      )
    : null
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
          {memberSinceLabel && (
            <span className="account-pass-since">Uczestnik od {memberSinceLabel}</span>
          )}
        </div>

        <div className="account-pass-stats" role="group" aria-label="Podsumowanie Twojej aktywności">
          <div className="account-pass-stat">
            <strong>{savedEvents.length + savedVenues.length}</strong>
            <span>Polubione</span>
          </div>
          <div className="account-pass-stat">
            <strong>{goingEvents.length}</strong>
            <span>Chcę iść</span>
          </div>
          <div className="account-pass-stat">
            <strong>{visitedEvents.length}</strong>
            <span>Byłem</span>
          </div>
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

      {methodsError && <p className="account-methods-error" role="alert">{methodsError}</p>}
      {methodsStatus && <p className="account-methods-success" role="status">{methodsStatus}</p>}
    </section>
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
  const feedbackNode = (
    <>
      {error && <p className="account-error" role="alert">{error}</p>}
      {successMessage && <p className="account-success" role="status">{successMessage}</p>}
    </>
  )
  const editViewNode = isEditing ? (
    <div className="account-edit-view">
      <header className="account-edit-view-header">
        <button
          type="button"
          className="account-edit-back"
          onClick={cancelEditing}
          aria-label="Wróć do Karnetu"
        >
          <ArrowLeft className="ui-icon" aria-hidden="true" />
        </button>
        <div>
          <span>Tryb edycji</span>
          <h1 id="account-panel-title">Edytuj profil</h1>
        </div>
      </header>

      {feedbackNode}

      <div className="account-edit-grid">
        <section className="account-edit-card" aria-labelledby="account-edit-basics-title">
          <h2 id="account-edit-basics-title">Podstawowe dane</h2>
          <div className="account-edit-avatar-row">
            <div className="account-edit-avatar-preview" aria-hidden="true">
              {photoURL ? (
                <img src={photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <label className="account-edit-name-field">
              <span>Imię i nazwisko</span>
              <input
                maxLength={64}
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
          </div>
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
          {CLOUDINARY_UPLOADS_ENABLED && (
            <div className="event-image-upload-section">
              <div className="event-image-upload-actions">
                <label
                  className={`button button-secondary event-image-upload-button${
                    isAvatarUploading ? ' is-disabled' : ''
                  }`}
                  aria-disabled={isAvatarUploading}
                >
                  <span>{isAvatarUploading ? 'Przesyłanie...' : 'Prześlij zdjęcie z dysku'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="event-image-upload-input"
                    disabled={isAvatarUploading}
                    onChange={(event) => void handleAvatarUpload(event.currentTarget)}
                  />
                </label>
                {photoURL && (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => {
                      setPhotoURL('')
                      setAvatarUploadError('')
                    }}
                    disabled={isAvatarUploading}
                  >
                    Usuń zdjęcie
                  </button>
                )}
              </div>
              {avatarUploadError && (
                <p className="account-error" role="alert">{avatarUploadError}</p>
              )}
            </div>
          )}
        </section>

        <section className="account-edit-card" aria-labelledby="account-edit-preferences-title">
          <h2 id="account-edit-preferences-title">Preferencje wydarzeń</h2>
          <p>Wybierz typy wydarzeń, które najbardziej Cię interesują.</p>
          {renderPreferenceControls(
            'edit',
            selectedEventTypes,
            (eventType) => setSelectedEventTypes((currentTypes) => toggleEventTypeSelection(currentTypes, eventType)),
            profileDefaultCity,
            setProfileDefaultCity,
          )}
        </section>

        <section className="account-edit-card" aria-labelledby="account-edit-verification-title">
          <h2 id="account-edit-verification-title">Status e-maila</h2>
          {currentUser.emailVerified ? (
            <p className="account-edit-verified">
              <BadgeCheck className="ui-icon" aria-hidden="true" />
              E-mail zweryfikowany
            </p>
          ) : (
            <>
              <p>Twój e-mail nie jest jeszcze zweryfikowany.</p>
              <button
                type="button"
                className="button button-secondary"
                disabled={isSendingVerification}
                onClick={() => void handleSendVerificationEmail()}
              >
                {isSendingVerification ? 'Wysyłanie…' : 'Wyślij link weryfikacyjny'}
              </button>
              {verificationStatus && (
                <p className="account-success" role="status">{verificationStatus}</p>
              )}
              {verificationError && (
                <p className="account-error" role="alert">{verificationError}</p>
              )}
            </>
          )}
        </section>

        {loginMethodsNode}
        {clearDataNode}
      </div>

      <div className="account-profile-form-actions account-edit-view-actions">
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
  ) : null
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
  const setupViewNode = (
    <div className="account-setup-view">
      <header className="account-setup-view-header">
        <span>
          <SlidersHorizontal className="ui-icon" aria-hidden="true" />
          Pierwsza konfiguracja
        </span>
        <h1 id="account-setup-title">Dostosuj Event Times</h1>
        <p>Ustaw domyślne miasto i typy wydarzeń, które chcesz szybciej odnajdywać. Wrócisz do tego później w „Edytuj profil”.</p>
      </header>

      {renderPreferenceControls(
        'setup',
        setupEventTypes,
        (eventType) => setSetupEventTypes((currentTypes) => toggleEventTypeSelection(currentTypes, eventType)),
        setupDefaultCity,
        setSetupDefaultCity,
      )}

      {feedbackNode}

      <div className="account-setup-view-actions">
        <button className="button button-primary" type="button" disabled={savingSetup} onClick={() => void saveSetupPreferences()}>
          {savingSetup ? 'Zapisywanie…' : 'Zapisz preferencje'}
        </button>
        <button className="button button-secondary" type="button" disabled={savingSetup} onClick={() => void skipSetup()}>
          Pomiń na razie
        </button>
      </div>
    </div>
  )

  function handlePanelClose() {
    if (isEditing && isEditFormDirty() && !window.confirm('Czy na pewno chcesz wyjść? Masz niezapisane zmiany.')) {
      return
    }

    onClose()
  }

  return (
    <div className="account-modal-backdrop" role="presentation" onMouseDown={handlePanelClose}>
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
          onClick={handlePanelClose}
          aria-label="Zamknij panel profilu"
        >
          <X className="ui-icon" aria-hidden="true" />
        </button>

        {isEditing ? (
          editViewNode
        ) : isSetupOpen ? (
          setupViewNode
        ) : !isMobile ? (
          <div className="account-profile-layout">
            <section className="account-pass" aria-labelledby="account-panel-title">
              {passCardNode}
              {quickActionsNode}
              {feedbackNode}
            </section>
            <section className="account-collection" aria-labelledby="account-collection-title">
              {collectionHeaderNode}
              {loading ? loadingNode : (<>{statStripNode}{collectionListNode}{memoriesNode}{activityNode}</>)}
            </section>
          </div>
        ) : (
          <div className="account-profile-layout account-profile-layout--mobile">
            <div className="account-pager-dots" role="tablist" aria-label="Strony profilu">
              {accountPagerPages.map((pageLabel, index) => (
                <button
                  key={pageLabel}
                  className={`account-pager-dot${activePagerPage === index ? ' is-active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={activePagerPage === index}
                  aria-label={pageLabel}
                  onClick={() => scrollToPagerPage(index)}
                />
              ))}
            </div>
            <div
              className="account-pager"
              ref={pagerRef}
              role="group"
              aria-label="Sekcje profilu"
              onScroll={handlePagerScroll}
              onPointerDown={handlePagerPointerDown}
              onPointerMove={handlePagerPointerMove}
              onPointerUp={handlePagerPointerEnd}
              onPointerCancel={handlePagerPointerEnd}
            >
              <section
                className={`account-page account-page--pass${passRevealed ? ' is-revealed' : ''}`}
                aria-labelledby="account-panel-title"
              >
                {passCardNode}
                {quickActionsNode}
                {feedbackNode}
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
