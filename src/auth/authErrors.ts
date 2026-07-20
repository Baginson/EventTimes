import { FirebaseError } from 'firebase/app'

const authErrorMessages: Record<string, string> = {
  'auth/account-exists-with-different-credential': 'Konto z tym adresem e-mail już istnieje. Zaloguj się dotychczasową metodą (np. Google), aby połączyć konta.',
  'auth/cancelled-popup-request': 'Poprzednie okno logowania nie zostało zamknięte.',
  'auth/credential-already-in-use': 'Ta metoda logowania jest już połączona z innym kontem.',
  'auth/email-already-in-use': 'Konto z tym adresem e-mail już istnieje.',
  'auth/invalid-credential': 'Nieprawidłowy e-mail lub hasło.',
  'auth/invalid-email': 'Podaj poprawny adres e-mail.',
  'auth/no-such-provider': 'Ta metoda logowania nie jest połączona z tym kontem.',
  'auth/operation-not-allowed': 'Ta metoda logowania nie jest włączona w Firebase.',
  'auth/popup-closed-by-user': 'Okno logowania zostało zamknięte.',
  'auth/popup-blocked': 'Przeglądarka zablokowała okno logowania.',
  'auth/provider-already-linked': 'Ta metoda logowania jest już połączona z Twoim kontem.',
  'auth/requires-recent-login': 'Ze względów bezpieczeństwa zaloguj się ponownie i spróbuj jeszcze raz.',
  'auth/too-many-requests': 'Zbyt wiele prób. Spróbuj ponownie później.',
  'auth/unauthorized-domain': 'Ta domena nie jest autoryzowana w Firebase.',
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
