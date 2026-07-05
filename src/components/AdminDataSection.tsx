import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { EventTimesEvent } from '../data/mockEvents'
import type { Venue } from '../data/mockVenues'
import {
  downloadLocalBackup,
  readLocalBackup,
} from '../services/localBackupService'
import type { LocalBackupData } from '../services/localBackupService'

type AdminDataSectionProps = {
  venues: Venue[]
  events: EventTimesEvent[]
  onImport: (backup: LocalBackupData) => void
  onReset: () => void
  onClear: () => void
}

export function AdminDataSection({
  venues,
  events,
  onImport,
  onReset,
  onClear,
}: AdminDataSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  function clearMessages() {
    setMessage('')
    setErrorMessage('')
  }

  function exportData() {
    clearMessages()

    try {
      downloadLocalBackup(venues, events)
      setMessage('Backup został wygenerowany.')
    } catch {
      setErrorMessage('Nie udało się wygenerować pliku backupu.')
    }
  }

  async function importData(changeEvent: ChangeEvent<HTMLInputElement>) {
    const file = changeEvent.target.files?.[0]
    changeEvent.target.value = ''

    if (!file) {
      return
    }

    clearMessages()

    try {
      const backup = await readLocalBackup(file)
      onImport(backup)
      setMessage(
        `Zaimportowano ${backup.venues.length} miejsc i ${backup.events.length} wydarzeń.`,
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nie udało się zaimportować danych.',
      )
    }
  }

  function resetData() {
    const confirmed = window.confirm(
      'Przywrócić dane startowe? Lokalne zmiany zostaną usunięte.',
    )

    if (!confirmed) {
      return
    }

    clearMessages()
    onReset()
    setMessage('Przywrócono dane startowe Event Times.')
  }

  function clearData() {
    const confirmed = window.confirm(
      'Usunąć lokalne dane miejsc i wydarzeń? Tej operacji nie można cofnąć bez backupu.',
    )

    if (!confirmed) {
      return
    }

    clearMessages()
    onClear()
    setMessage(
      'Lokalne dane zostały usunięte. Aplikacja korzysta ponownie z danych startowych.',
    )
  }

  return (
    <section className="admin-data-section" aria-labelledby="admin-data-title">
      <div className="admin-section-heading">
        <div>
          <h2 id="admin-data-title">Dane lokalne / Backup</h2>
          <p>Dane są obecnie zapisane lokalnie w tej przeglądarce.</p>
        </div>
      </div>

      <div className="admin-data-summary">
        <div>
          <strong>{venues.length}</strong>
          <span>Miejsca</span>
        </div>
        <div>
          <strong>{events.length}</strong>
          <span>Wydarzenia</span>
        </div>
      </div>

      <div className="admin-data-actions">
        <button className="button button-primary" type="button" onClick={exportData}>
          Eksportuj dane
        </button>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          Importuj dane
        </button>
        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={importData}
        />
      </div>

      <div className="admin-data-danger-zone">
        <h3>Zarządzanie danymi</h3>
        <p>Przed usunięciem własnych danych warto wykonać eksport.</p>
        <div>
          <button className="button button-secondary" type="button" onClick={resetData}>
            Resetuj do danych startowych
          </button>
          <button className="button admin-danger-button" type="button" onClick={clearData}>
            Wyczyść lokalne dane
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className="admin-form-message admin-form-error" role="alert">
          {errorMessage}
        </p>
      )}
      {message && (
        <p className="admin-form-message admin-form-success" role="status">
          {message}
        </p>
      )}
    </section>
  )
}
