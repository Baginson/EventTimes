import { Search, Shield, User } from 'lucide-react'

type MobileBottomBarProps = {
  isAdmin: boolean
  isAdminMode: boolean
  isHidden: boolean
  onSearch: () => void
  onProfile: () => void
  onAdmin: () => void
}

export function MobileBottomBar({
  isAdmin,
  isAdminMode,
  isHidden,
  onSearch,
  onProfile,
  onAdmin,
}: MobileBottomBarProps) {
  return (
    <nav
      className={`mobile-bottom-bar${isAdmin ? ' is-admin' : ''}${
        isHidden ? ' is-hidden' : ''
      }`}
      aria-label="Główne akcje mobile"
    >
      <button type="button" onClick={onSearch} aria-label="Otwórz wyszukiwarkę">
        <Search aria-hidden="true" />
        <span>Szukaj</span>
      </button>
      <button type="button" onClick={onProfile} aria-label="Otwórz profil">
        <User aria-hidden="true" />
        <span>Profil</span>
      </button>
      {isAdmin && (
        <button
          className={isAdminMode ? 'is-active' : ''}
          type="button"
          onClick={onAdmin}
          aria-label="Otwórz panel admina"
          aria-pressed={isAdminMode}
        >
          <Shield aria-hidden="true" />
          <span>Admin</span>
        </button>
      )}
    </nav>
  )
}
