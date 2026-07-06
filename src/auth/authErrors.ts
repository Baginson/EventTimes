import { FirebaseError } from 'firebase/app'

const authErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'Konto z tym adresem e-mail już istnieje.',
  'auth/invalid-credential': 'Nieprawidłowy e-mail lub hasło.',
  'auth/invalid-email': 'Podaj poprawny adres e-mail.',
  'auth/operation-not-allowed': 'Ta metoda logowania nie jest włączona w Firebase.',
  'auth/popup-closed-by-user': 'Okno logowania Google zostało zamknięte.',
  'auth/popup-blocked': 'Przeglądarka zablokowała okno logowania Google.',
  'auth/too-many-requests': 'Zbyt wiele prób. Spróbuj ponownie później.',
  'auth/user-disabled': 'To konto zostało wyłączone.',
  'auth/user-not-found': 'Konto z tym adresem e-mail nie istnieje.',
  'auth/weak-password': 'Hasło jest zbyt słabe. Użyj co najmniej 6 znaków.',
  'auth/wrong-password': 'Nieprawidłowe hasło.',
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    return authErrorMessages[error.code] ?? 'Nie udało się wykonać operacji logowania.'
  }

  return error instanceof Error ? error.message : 'Nie udało się wykonać operacji logowania.'
}
