import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/authContext'
import { EventTimesApiConfigError } from '../services/eventTimesApi'
import { saveUsernameToProfile } from '../services/userProfileService'
import {
  registerUsername,
  UsernameTakenError,
} from '../services/usernameService'
import {
  isValidUsername,
  normalizeUsername,
  USERNAME_RULES_MESSAGE,
} from '../utils/username'

export function UsernameGate() {
  const { user, markUsernameSet } = useAuth()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!user) {
    return null
  }

  const currentUser = user

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    const normalized = normalizeUsername(value)

    if (!isValidUsername(normalized)) {
      setError(USERNAME_RULES_MESSAGE)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const idToken = await currentUser.getIdToken()
      const savedUsername = await registerUsername(idToken, normalized)
      await saveUsernameToProfile(currentUser.uid, savedUsername)
      markUsernameSet()
    } catch (submitError) {
      if (submitError instanceof UsernameTakenError) {
        setError(submitError.message)
      } else if (submitError instanceof EventTimesApiConfigError) {
        setError('Funkcja nazwy użytkownika jest chwilowo niedostępna. Spróbuj ponownie później.')
      } else {
        setError('Nie udało się zapisać nazwy użytkownika.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="username-gate-backdrop" role="presentation">
      <section
        className="auth-modal username-gate"
        role="dialog"
        aria-modal="true"
        aria-labelledby="username-gate-title"
      >
        <span className="auth-modal-kicker">Event Times</span>
        <h1 id="username-gate-title">Wybierz nazwę użytkownika</h1>
        <p>Ostatni krok — nazwa użytkownika pozwala logować się bez podawania e-maila. Musisz ją ustawić, żeby kontynuować.</p>

        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            <span>Nazwa użytkownika</span>
            <input
              autoFocus
              maxLength={20}
              autoComplete="off"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              disabled={submitting}
            />
          </label>
          <small>{USERNAME_RULES_MESSAGE}</small>

          {error && (
            <p className="auth-form-error" role="alert">
              {error}
            </p>
          )}

          <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Zapisywanie…' : 'Zapisz i kontynuuj'}
          </button>
        </form>
      </section>
    </div>
  )
}
