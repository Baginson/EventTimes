import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getAuthErrorMessage } from '../auth/authErrors'
import { useAuth } from '../auth/authContext'

type AuthMode = 'login' | 'register'

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
  } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthModalOpen) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAuthModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [closeAuthModal, isAuthModalOpen])

  if (!isAuthModalOpen) {
    return null
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError('')
    setPassword('')
    setPasswordConfirmation('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Podaj e-mail i hasło.')
      return
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setError('Hasło musi mieć co najmniej 6 znaków.')
        return
      }

      if (password !== passwordConfirmation) {
        setError('Podane hasła nie są takie same.')
        return
      }
    }

    setSubmitting(true)

    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password)
      } else {
        await registerWithEmail(displayName, email.trim(), password)
      }
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setSubmitting(true)

    try {
      await signInWithGoogle()
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-modal-backdrop" role="presentation" onMouseDown={closeAuthModal}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="auth-modal-close" type="button" onClick={closeAuthModal} aria-label="Zamknij">
          ×
        </button>

        <span className="auth-modal-kicker">Event Times</span>
        <h1 id="auth-modal-title">{mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}</h1>
        <p>
          {mode === 'login'
            ? 'Zaloguj się, aby zapisywać miejsca i wydarzenia.'
            : 'Załóż bezpłatne konto Event Times.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              <span>Nazwa użytkownika</span>
              <input
                autoFocus
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
          )}

          <label>
            <span>E-mail</span>
            <input
              autoFocus={mode === 'login'}
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            <span>Hasło</span>
            <input
              required
              type="password"
              minLength={mode === 'register' ? 6 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {mode === 'register' && (
            <label>
              <span>Powtórz hasło</span>
              <input
                required
                type="password"
                minLength={6}
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
              />
            </label>
          )}

          {error && <p className="auth-form-error" role="alert">{error}</p>}

          <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Proszę czekać…' : mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
          </button>
        </form>

        <button className="auth-mode-switch" type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Nie masz konta? Załóż konto' : 'Masz konto? Zaloguj się'}
        </button>

        <div className="auth-divider"><span>lub</span></div>

        <button className="button button-secondary auth-google" type="button" disabled={submitting} onClick={() => void handleGoogleSignIn()}>
          Kontynuuj z Google
        </button>
      </section>
    </div>
  )
}
