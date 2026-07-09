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
  onImportFirestore: (backup: LocalBackupData) => Promise<void>
  onMoveCurrentDataToFirestore: () => Promise<void>
  onReset: () => void
  onClear: () => void
}

export function AdminDataSection({
  venues,
  events,
  onImport,
  onImportFirestore,
  onMoveCurrentDataToFirestore,
  onReset,
  onClear,
}: AdminDataSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const firestoreFileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isImportingLocal, setIsImportingLocal] = useState(false)
  const [isImportingFirestore, setIsImportingFirestore] = useState(false)
  const [isMovingToFirestore, setIsMovingToFirestore] = useState(false)

  function clearMessages() {
    setMessage('')
    setErrorMessage('')
  }

  function exportData() {
    clearMessages()

    try {
      downloadLocalBackup(venues, events)
      setMessage('Backup zostaÄąâ€š wygenerowany.')
    } catch {
      setErrorMessage('Nie udaÄąâ€šo siĂ„â„˘ wygenerowaĂ„â€ˇ pliku backupu.')
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
      setIsImportingLocal(true)
      const backup = await readLocalBackup(file)
      onImport(backup)
      setMessage(
        `Zaimportowano ${backup.venues.length} miejsc i ${backup.events.length} wydarzeÄąâ€ž.`,
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nie udaÄąâ€šo siĂ„â„˘ zaimportowaĂ„â€ˇ danych.',
      )
    } finally {
      setIsImportingLocal(false)
    }
  }

  async function importDataToFirestore(changeEvent: ChangeEvent<HTMLInputElement>) {
    const file = changeEvent.target.files?.[0]
    changeEvent.target.value = ''

    if (!file) {
      return
    }

    const confirmed = window.confirm(
      'To zapisze dane do Firestore i będą widoczne na publicznej stronie. Kontynuować?',
    )

    if (!confirmed) {
      return
    }

    clearMessages()

    try {
      setIsImportingFirestore(true)
      const backup = await readLocalBackup(file)

      if (
        (venues.length > 0 || events.length > 0) &&
        !window.confirm(
          `Firestore ma obecnie ${venues.length} miejsc i ${events.length} wydarzeń w stanie aplikacji. Import zapisze dokumenty z tymi samymi id przez merge. Kontynuować?`,
        )
      ) {
        return
      }

      await onImportFirestore(backup)
      setMessage('Zaimportowano dane do Firestore.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nie udało się zaimportować danych do Firestore.',
      )
    } finally {
      setIsImportingFirestore(false)
    }
  }

  async function moveCurrentDataToFirestore() {
    const confirmed = window.confirm(
      'Przenieść aktualnie widoczne miejsca i wydarzenia do Firestore? Dane będą widoczne na publicznej stronie.',
    )

    if (!confirmed) {
      return
    }

    clearMessages()

    try {
      setIsMovingToFirestore(true)
      await onMoveCurrentDataToFirestore()
      setMessage('Zaimportowano dane do Firestore.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nie udało się przenieść danych do Firestore.',
      )
    } finally {
      setIsMovingToFirestore(false)
    }
  }

  function resetData() {
    const confirmed = window.confirm(
      'PrzywrÄ‚Ĺ‚ciĂ„â€ˇ dane startowe? Lokalne zmiany zostanĂ„â€¦ usuniĂ„â„˘te.',
    )

    if (!confirmed) {
      return
    }

    clearMessages()
    onReset()
    setMessage('PrzywrÄ‚Ĺ‚cono dane startowe Event Times.')
  }

  function clearData() {
    const confirmed = window.confirm(
      'UsunĂ„â€¦Ă„â€ˇ lokalne dane miejsc i wydarzeÄąâ€ž? Tej operacji nie moÄąÄ˝na cofnĂ„â€¦Ă„â€ˇ bez backupu.',
    )

    if (!confirmed) {
      return
    }

    clearMessages()
    onClear()
    setMessage(
      'Lokalne dane zostaÄąâ€šy usuniĂ„â„˘te. Aplikacja korzysta ponownie z danych startowych.',
    )
  }

  return (
    <section className="admin-data-section" aria-labelledby="admin-data-title">
      <div className="admin-section-heading">
        <div>
          <h2 id="admin-data-title">Dane lokalne / Backup</h2>
          <p>Dane sĂ„â€¦ obecnie zapisane lokalnie w tej przeglĂ„â€¦darce.</p>
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
          disabled={isImportingLocal}
        >
          {isImportingLocal ? 'Importowanie...' : 'Importuj dane'}
        </button>
        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={importData}
        />
      </div>

      <div className="admin-data-danger-zone admin-firestore-import-zone">
        <h3>Firestore / dane publiczne</h3>
        <p>
          Dane zapisane tutaj bĂ„â„˘dĂ„â€¦ uÄąÄ˝ywane przez publicznĂ„â€¦ wersjĂ„â„˘ Event Times.
          Import jest dostĂ„â„˘pny tylko dla admina i wymaga reguÄąâ€š Firestore opartych o
          kolekcjĂ„â„˘ <code>admins</code>.
        </p>
        <div>
          <button
            className="button button-primary"
            type="button"
            onClick={() => firestoreFileInputRef.current?.click()}
            disabled={isImportingFirestore || isMovingToFirestore}
          >
            {isImportingFirestore ? 'Importowanie...' : 'Importuj dane JSON do Firestore'}
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => void moveCurrentDataToFirestore()}
            disabled={isImportingFirestore || isMovingToFirestore}
          >
            {isMovingToFirestore ? 'Zapisywanie...' : 'Przenieś aktualne dane do Firestore'}
          </button>
          <input
            ref={firestoreFileInputRef}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={(event) => void importDataToFirestore(event)}
          />
        </div>
      </div>

      <div className="admin-data-danger-zone">
        <h3>ZarzĂ„â€¦dzanie danymi</h3>
        <p>Przed usuniĂ„â„˘ciem wÄąâ€šasnych danych warto wykonaĂ„â€ˇ eksport.</p>
        <div>
          <button className="button button-secondary" type="button" onClick={resetData}>
            Resetuj do danych startowych
          </button>
          <button className="button admin-danger-button" type="button" onClick={clearData}>
            WyczyÄąâ€şĂ„â€ˇ lokalne dane
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
