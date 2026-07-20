// Zasady nazwy użytkownika — te same po stronie Workera (eventtimes-api):
// 3-20 znaków, małe litery/cyfry/kropka/podkreślnik/myślnik, start od litery lub cyfry.
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,19}$/

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(normalizeUsername(value))
}

// Pole logowania przyjmuje e-mail albo nazwę użytkownika — rozstrzyga '@'.
export function classifyLoginIdentifier(value: string): 'email' | 'username' | 'invalid' {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'invalid'
  }

  if (trimmed.includes('@')) {
    return 'email'
  }

  return isValidUsername(trimmed) ? 'username' : 'invalid'
}

export const USERNAME_RULES_MESSAGE =
  'Nazwa użytkownika: 3-20 znaków, małe litery, cyfry oraz . _ - (start od litery lub cyfry).'
