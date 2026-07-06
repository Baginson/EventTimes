import { useAuth } from '../auth/authContext'

type UserMenuProps = {
  onOpenProfile: () => void
}

export function UserMenu({ onOpenProfile }: UserMenuProps) {
  const { user, loading, openAuthModal, configurationError } = useAuth()

  if (!user) {
    return (
      <div className="user-menu">
        <button
          className="button button-primary"
          type="button"
          disabled={loading}
          onClick={openAuthModal}
          title={configurationError ?? undefined}
        >
          {loading ? 'Ładowanie…' : 'Zaloguj się'}
        </button>
      </div>
    )
  }

  return (
    <div className="user-menu">
      <button
        className="user-menu-trigger"
        type="button"
        onClick={onOpenProfile}
        aria-label="Otwórz mój profil"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span aria-hidden="true">{(user.displayName ?? user.email ?? 'U').charAt(0)}</span>
        )}
        <strong>{user.displayName ?? user.email}</strong>
      </button>
    </div>
  )
}
