import { getEventTimesApiUrl } from './eventTimesApi'
import { normalizeUsername } from '../utils/username'

// Ogólny komunikat — celowo nie rozróżniamy "zła nazwa" od "złe hasło",
// żeby nie dało się sprawdzać, które konta istnieją.
export const GENERIC_LOGIN_ERROR = 'Nieprawidłowy login lub hasło.'

export class UsernameLoginError extends Error {
  constructor(message = GENERIC_LOGIN_ERROR) {
    super(message)
    this.name = 'UsernameLoginError'
  }
}

export class UsernameTakenError extends Error {
  constructor() {
    super('Ta nazwa użytkownika jest już zajęta.')
    this.name = 'UsernameTakenError'
  }
}

// Worker weryfikuje hasło w Firebase zanim ujawni e-mail przypisany do nazwy,
// więc sama znajomość nazwy nie pozwala poznać cudzego adresu.
export async function resolveEmailForUsernameLogin(
  username: string,
  password: string,
): Promise<string> {
  const response = await fetch(getEventTimesApiUrl('/api/auth/username-login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: normalizeUsername(username), password }),
  })

  if (response.status === 429) {
    throw new UsernameLoginError('Zbyt wiele prób. Spróbuj ponownie później.')
  }

  if (!response.ok) {
    throw new UsernameLoginError()
  }

  const data = (await response.json().catch(() => null)) as { email?: unknown } | null

  if (!data || typeof data.email !== 'string' || !data.email) {
    throw new UsernameLoginError()
  }

  return data.email
}

export async function registerUsername(idToken: string, username: string): Promise<string> {
  const normalized = normalizeUsername(username)
  const response = await fetch(getEventTimesApiUrl('/api/auth/username'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ username: normalized }),
  })

  if (response.status === 409) {
    throw new UsernameTakenError()
  }

  if (response.status === 429) {
    throw new Error('Zbyt wiele prób. Spróbuj ponownie później.')
  }

  if (!response.ok) {
    throw new Error('Nie udało się zapisać nazwy użytkownika.')
  }

  return normalized
}
