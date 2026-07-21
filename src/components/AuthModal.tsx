import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { getAuthErrorMessage } from '../auth/authErrors'
import { useAuth } from '../auth/authContext'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { EventTimesApiConfigError } from '../services/eventTimesApi'
import { resolveEmailForUsernameLogin, UsernameLoginError } from '../services/usernameService'
import { classifyLoginIdentifier } from '../utils/username'

type AuthMode = 'login' | 'register' | 'reset'

const RESET_SUCCESS_MESSAGE = 'Jeśli konto istnieje, wysłaliśmy e-mail z linkiem do zmiany hasła.'

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithProvider,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
    authNotice,
    clearAuthNotice,
    pendingLinkInfo,
  } = useAuth()
  const isFinePointer = useMediaQuery('(pointer: fine)')
  const [mode, setMode] = useState<AuthMode>('login')
  const [identifier, setIdentifier] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleClose = useCallback(() => {
    clearAuthNotice()
    closeAuthModal()
  }, [clearAuthNotice, closeAuthModal])

  useEffect(() => {
    if (!isAuthModalOpen) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [handleClose, isAuthModalOpen])

  if (!isAuthModalOpen) {
    return null
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setPassword('')
    setPasswordConfirmation('')
    clearAuthNotice()
  }

  function switchToResetMode() {
    if (identifier.includes('@')) {
      setEmail(identifier.trim())
    }

    switchMode('reset')
  }

  async function handleLoginSubmit() {
    const loginIdentifier = identifier.trim()
    const identifierType = classifyLoginIdentifier(loginIdentifier)

    if (identifierType === 'invalid') {
      setError('Podaj adres e-mail lub poprawną nazwę użytkownika.')
      return
    }

    setSubmitting(true)

    try {
      if (identifierType === 'email') {
        await signInWithEmail(loginIdentifier, password)
        return
      }

      const resolvedEmail = await resolveEmailForUsernameLogin(loginIdentifier, password)
      await signInWithEmail(resolvedEmail, password)
    } catch (authError) {
      if (authError instanceof UsernameLoginError) {
        setError(authError.message)
        return
      }

      if (authError instanceof EventTimesApiConfigError) {
        setError('Logowanie nazwą użytkownika jest chwilowo niedostępne. Użyj adresu e-mail.')
        return
      }

      setError(getAuthErrorMessage(authError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegisterSubmit() {
    if (!email.trim() || !password) {
      setError('Podaj e-mail i hasło.')
      return
    }

    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.')
      return
    }

    if (password !== passwordConfirmation) {
      setError('Podane hasła nie są takie same.')
      return
    }

    setSubmitting(true)

    try {
      await registerWithEmail(displayName, email.trim(), password)
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetSubmit() {
    setSubmitting(true)

    try {
      await resetPassword(email.trim())
    } catch {
      // Reset hasła nie ujawnia, czy konto istnieje.
    } finally {
      setSuccess(RESET_SUCCESS_MESSAGE)
      setSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    setError('')
    setSuccess('')

    if (mode === 'login') {
      await handleLoginSubmit()
      return
    }

    if (mode === 'register') {
      await handleRegisterSubmit()
      return
    }

    await handleResetSubmit()
  }

  async function handleProviderSignIn(providerId: 'google' | 'github') {
    if (submitting) {
      return
    }

    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await signInWithProvider(providerId)
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
    } finally {
      setSubmitting(false)
    }
  }

  const title = mode === 'login' ? 'Zaloguj się' : mode === 'register' ? 'Utwórz konto' : 'Reset hasła'
  const description =
    mode === 'login'
      ? 'Zaloguj się, aby zapisywać miejsca i wydarzenia.'
      : mode === 'register'
        ? 'Załóż bezpłatne konto Event Times.'
        : 'Podaj adres e-mail konta, a wyślemy link do zmiany hasła.'

  return (
    <div className="auth-modal-backdrop" role="presentation" onMouseDown={handleClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="auth-modal-close" type="button" onClick={handleClose} aria-label="Zamknij" disabled={submitting}>
          <X className="ui-icon" aria-hidden="true" />
        </button>

        <span className="auth-modal-kicker">Event Times</span>
        <h1 id="auth-modal-title">{title}</h1>
        <p>{description}</p>

        {mode === 'login' && pendingLinkInfo && (
          <p className="auth-link-notice" role="status">
            Konto {pendingLinkInfo.email} już istnieje. Zaloguj się dotychczasową metodą, aby połączyć logowanie{' '}
            {pendingLinkInfo.providerLabel}.
          </p>
        )}

        {authNotice && (
          <p className="auth-success" role="status">
            {authNotice}
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit} aria-busy={submitting}>
          {mode === 'register' && (
            <label>
              <span>Imię i nazwisko</span>
              <input
                autoFocus={isFinePointer}
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
          )}

          {mode === 'login' ? (
            <label>
              <span>E-mail lub nazwa użytkownika</span>
              <input
                autoFocus={isFinePointer}
                required
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </label>
          ) : (
            <label>
              <span>E-mail</span>
              <input
                autoFocus={mode === 'reset' && isFinePointer}
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          )}

          {mode !== 'reset' && (
            <label>
              <span>Hasło</span>
              <input
                required
                type="password"
                minLength={mode === 'register' ? 8 : undefined}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          )}

          {mode === 'login' && (
            <button className="auth-reset-link" type="button" disabled={submitting} onClick={switchToResetMode}>
              Nie pamiętam hasła
            </button>
          )}

          {mode === 'register' && (
            <label>
              <span>Powtórz hasło</span>
              <input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
              />
            </label>
          )}

          {error && (
            <p className="auth-form-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="auth-success" role="status">
              {success}
            </p>
          )}

          <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? 'Proszę czekać…'
              : mode === 'login'
                ? 'Zaloguj się'
                : mode === 'register'
                  ? 'Utwórz konto'
                  : 'Wyślij link resetujący'}
          </button>
        </form>

        {mode !== 'reset' ? (
          <>
            <div className="auth-divider">
              <span>lub</span>
            </div>

            <div className="auth-oauth-buttons">
              <button
                className="button button-secondary auth-oauth-button"
                type="button"
                disabled={submitting}
                onClick={() => void handleProviderSignIn('google')}
              >
                {submitting ? 'Proszę czekać…' : 'Kontynuuj z Google'}
              </button>
              <button
                className="button button-secondary auth-oauth-button"
                type="button"
                disabled={submitting}
                onClick={() => void handleProviderSignIn('github')}
              >
                {submitting ? 'Proszę czekać…' : 'Kontynuuj z GitHubem'}
              </button>
            </div>

            <button
              className="auth-mode-switch"
              type="button"
              disabled={submitting}
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Nie masz konta? Załóż konto' : 'Masz konto? Zaloguj się'}
            </button>
          </>
        ) : (
          <button className="auth-mode-switch" type="button" disabled={submitting} onClick={() => switchMode('login')}>
            Wróć do logowania
          </button>
        )}
      </section>
    </div>
  )
}
