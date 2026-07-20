import { useEffect, useRef, useState } from 'react'
import { Navigation } from 'lucide-react'
import type { Venue } from '../data/mockVenues'
import { hasValidVenueCoordinates } from '../utils/googleMaps'
import {
  buildAppleMapsUrl,
  buildGeoUri,
  buildGoogleMapsNavigationUrl,
  getCurrentNavigationPlatform,
} from '../utils/navigationLinks'

const NAVIGATION_LABEL = 'Nawiguj do miejsca'

type NavigationButtonProps = {
  venue: Venue
}

export function NavigationButton({ venue }: NavigationButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const platform = getCurrentNavigationPlatform()
  const hasCoordinates = hasValidVenueCoordinates(venue)
  const webUrl = buildGoogleMapsNavigationUrl(venue)

  useEffect(() => {
    setIsMenuOpen(false)
  }, [venue.id])

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    function handlePointerDown(pointerEvent: PointerEvent) {
      if (
        pointerEvent.target instanceof Node &&
        !containerRef.current?.contains(pointerEvent.target)
      ) {
        setIsMenuOpen(false)
      }
    }

    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === 'Escape') {
        // Escape ma zamknąć tylko menu nawigacji, nie cały panel.
        keyboardEvent.stopPropagation()
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isMenuOpen])

  // Android: geo: otwiera systemowy wybór zainstalowanych aplikacji nawigacyjnych.
  if (platform === 'android' && hasCoordinates) {
    return (
      <a
        className="navigation-icon-button"
        href={buildGeoUri(venue)}
        aria-label={NAVIGATION_LABEL}
        title={NAVIGATION_LABEL}
      >
        <Navigation className="ui-icon" aria-hidden="true" />
      </a>
    )
  }

  // iOS nie ma systemowego wyboru dla linków nawigacyjnych — dajemy własny.
  if (platform === 'ios' && hasCoordinates) {
    return (
      <div className="navigation-action" ref={containerRef}>
        <button
          className="navigation-icon-button"
          type="button"
          aria-label={NAVIGATION_LABEL}
          title={NAVIGATION_LABEL}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
        >
          <Navigation className="ui-icon" aria-hidden="true" />
        </button>
        {isMenuOpen && (
          <div className="navigation-menu" role="menu" aria-label="Wybierz aplikację nawigacji">
            <a
              role="menuitem"
              href={buildAppleMapsUrl(venue)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
            >
              Apple Maps
            </a>
            <a
              role="menuitem"
              href={webUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
            >
              Google Maps
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <a
      className="navigation-icon-button"
      href={webUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={NAVIGATION_LABEL}
      title={NAVIGATION_LABEL}
    >
      <Navigation className="ui-icon" aria-hidden="true" />
    </a>
  )
}
