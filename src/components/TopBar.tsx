export function TopBar() {
  return (
    <header className="top-bar">
      <a className="brand" href="/" aria-label="Event Times — strona główna">
        <span className="brand-mark" aria-hidden="true">
          ET
        </span>
        <span>Event Times</span>
      </a>

      <label className="search-box">
        <span className="visually-hidden">Szukaj miejsc i wydarzeń</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
        </svg>
        <input type="search" placeholder="Szukaj miejsc i wydarzeń" />
      </label>

      <nav className="top-bar-actions" aria-label="Główne akcje">
        <button className="button button-secondary" type="button">
          Filtry
        </button>
        <button className="button button-primary" type="button">
          Zaloguj się
        </button>
      </nav>
    </header>
  )
}
