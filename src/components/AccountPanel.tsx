import { useEffect, useState } from 'react'
import { useAuth } from '../auth/authContext'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import {
  clearAllUserActions,
  getAllUserActions,
} from '../services/userActionService'
import type { EventAction, VenueAction } from '../services/userActionService'

type AccountPanelProps = {
  venues: Venue[]
  events: EventTimesEvent[]
  onVenueSelect: (venue: Venue) => void
  onEventSelect: (event: EventTimesEvent, venue: Venue) => void
  onClose: () => void
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function AccountPanel({
  venues,
  events,
  onVenueSelect,
  onEventSelect,
  onClose,
}: AccountPanelProps) {
  const { user, isAdmin, updateProfile, logout } = useAuth()
  const [eventActions, setEventActions] = useState<EventAction[]>([])
  const [venueActions, setVenueActions] = useState<VenueAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [clearingData, setClearingData] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    let active = true
    setLoading(true)
    setError('')

    void getAllUserActions(user.uid)
      .then((actions) => {
        if (active) {
          setEventActions(actions.eventActions)
          setVenueActions(actions.venueActions)
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

  if (!user) {
    return null
  }

  const currentUser = user

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
    setError('')
    setSuccessMessage('')
    setIsEditing(true)
  }

  function cancelEditing() {
    setDisplayName(currentUser.displayName ?? '')
    setPhotoURL(currentUser.photoURL ?? googlePhotoURL ?? '')
    setError('')
    setIsEditing(false)
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
      await updateProfile(
        normalizedName,
        normalizedPhotoURL || googlePhotoURL || null,
      )
      setSuccessMessage('Profil został zaktualizowany.')
      setIsEditing(false)
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Nie udało się zapisać profilu.')
    } finally {
      setSavingProfile(false)
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

  function renderEventItems(actions: EventAction[]) {
    if (!actions.length) {
      return <p className="account-empty">Brak elementów.</p>
    }

    return (
      <ul className="account-list">
        {actions.map((action) => {
          const event = events.find((candidate) => candidate.id === action.eventId)
          const venue = event
            ? venues.find((candidate) => candidate.id === event.venueId)
            : undefined

          return (
            <li key={action.eventId}>
              {event && venue ? (
                <button type="button" onClick={() => onEventSelect(event, venue)}>
                  <strong>{event.name}</strong>
                  <span>{venue.name}</span>
                </button>
              ) : (
                <div><strong>Element niedostępny</strong><span>{action.eventId}</span></div>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="account-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <aside
      className="account-panel"
      aria-label="Mój profil"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button className="account-panel-close" type="button" onClick={onClose} aria-label="Zamknij">
        ×
      </button>

      <div className="account-profile">
        {avatarURL ? (
          <img src={avatarURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="account-profile-initial" aria-hidden="true">{initial}</span>
        )}
        <span>Profil użytkownika</span>
        <h1>{currentUser.displayName ?? currentUser.email ?? 'Użytkownik Event Times'}</h1>
        <p>{currentUser.email}</p>
        {isAdmin && <span className="account-admin-badge">Administrator</span>}
      </div>

      <section className="account-profile-edit" aria-labelledby="profile-edit-title">
        <div className="account-section-heading">
          <h2 id="profile-edit-title">Edycja profilu</h2>
          {!isEditing && <button type="button" onClick={startEditing}>Edytuj</button>}
        </div>

        {isEditing && (
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
            <div className="account-profile-form-actions">
              <button className="button button-primary" type="button" disabled={savingProfile} onClick={() => void saveProfile()}>
                {savingProfile ? 'Zapisywanie…' : 'Zapisz profil'}
              </button>
              <button className="button button-secondary" type="button" disabled={savingProfile} onClick={cancelEditing}>
                Anuluj
              </button>
            </div>
          </div>
        )}
      </section>

      {error && <p className="account-error" role="alert">{error}</p>}
      {successMessage && <p className="account-success" role="status">{successMessage}</p>}

      <div className="account-saved">
        <h1>Moje aktywności</h1>
        {loading ? (
          <p>Ładowanie aktywności…</p>
        ) : (
          <>
            <section><h2>Polubione wydarzenia</h2>{renderEventItems(savedEvents)}</section>
            <section><h2>Chcę iść</h2>{renderEventItems(goingEvents)}</section>
            <section><h2>Byłem</h2>{renderEventItems(visitedEvents)}</section>
            <section>
              <h2>Polubione miejsca</h2>
              {savedVenues.length ? (
                <ul className="account-list">
                  {savedVenues.map((action) => {
                    const venue = venues.find((candidate) => candidate.id === action.venueId)
                    return (
                      <li key={action.venueId}>
                        {venue ? (
                          <button type="button" onClick={() => onVenueSelect(venue)}>
                            <strong>{venue.name}</strong><span>{venue.address}</span>
                          </button>
                        ) : (
                          <div><strong>Element niedostępny</strong><span>{action.venueId}</span></div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : <p className="account-empty">Brak elementów.</p>}
            </section>
          </>
        )}
      </div>

      <section className="account-clear-data" aria-labelledby="clear-data-title">
        <h2 id="clear-data-title">Wyczyść moje dane</h2>
        <p>Usuwa polubione i aktywności. Konto oraz profil pozostaną bez zmian.</p>
        <button type="button" disabled={clearingData} onClick={() => void clearUserData()}>
          {clearingData ? 'Czyszczenie…' : 'Wyczyść polubione i aktywności'}
        </button>
      </section>

      <section className="account-logout" aria-labelledby="account-logout-title">
        <div>
          <h2 id="account-logout-title">Konto</h2>
          <p>Możesz bezpiecznie wylogować się z tego urządzenia.</p>
        </div>
        <button type="button" onClick={() => void handleLogout()}>Wyloguj</button>
      </section>
    </aside>
    </div>
  )
}
