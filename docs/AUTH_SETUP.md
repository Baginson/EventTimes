# Logowanie — konfiguracja i pakiet zmian Workera

Dokument opisuje wszystko, co trzeba skonfigurować poza tym repo, żeby działał pełny system logowania: Google + GitHub + e-mail/hasło + nazwa użytkownika. Kod frontendu jest już gotowy (`src/auth/*`, `src/services/usernameService.ts`, `src/utils/username.ts`, `AuthModal`, sekcja „Metody logowania" w `AccountPanel`).

## 1. Firebase Console

1. **Authentication → Sign-in method**:
   - `E-mail/hasło` — włączone (już było).
   - `Google` — włączone (już było).
   - `GitHub` — włącz i wklej Client ID + Client Secret z GitHub OAuth App (punkt 2). Skopiuj z tego ekranu **callback URL** (`https://<projekt>.firebaseapp.com/__/auth/handler`) — potrzebny w GitHubie.
2. **Authentication → Settings → User account linking**: zostaw **„Link accounts that use the same email"** wyłączone / tryb „One account per email address" (jedno konto na adres). Dzięki temu logowanie GitHubem na e-mail istniejącego konta Google rzuca `auth/account-exists-with-different-credential`, a frontend robi bezpieczne łączenie po potwierdzeniu dostępu do starej metody (nigdy po samej zgodności tekstu e-maila).
3. **Authentication → Settings → Authorized domains**: upewnij się, że jest `localhost` i `baginson.github.io`.
4. Nie włączaj logowania telefonem (płatne SMS-y) — poza zakresem.

## 2. GitHub OAuth App

GitHub → Settings → Developer settings → **OAuth Apps → New OAuth App**:

- Application name: `Event Times`
- Homepage URL: `https://baginson.github.io/EventTimes/`
- Authorization callback URL: **callback z Firebase** (`https://<projekt>.firebaseapp.com/__/auth/handler`)

Wygeneruj Client Secret; oba wklej w Firebase (punkt 1.1). Frontend nie zna tych wartości.

## 3. Worker `eventtimes-api` — logowanie nazwą użytkownika

Repo Workera jest osobne — poniżej kompletny pakiet do wklejenia. Mapa nazw użytkowników żyje **w Cloudflare KV**, nie w Firestore (klient nie może czytać cudzych e-maili; reguły Firestore się nie zmieniają).

### 3.1. Nowe bindings / zmienne

```bash
wrangler kv namespace create AUTH_KV
wrangler secret put FIREBASE_WEB_API_KEY   # klucz Web API projektu Firebase (ten sam co VITE_FIREBASE_API_KEY)
```

`wrangler.toml`:

```toml
kv_namespaces = [
  { binding = "AUTH_KV", id = "<id z komendy powyżej>" }
]

[vars]
FIREBASE_PROJECT_ID = "<projekt-firebase>"   # np. eventtimes-xxxxx
```

Klucz Web API Firebase jest z natury publiczny (siedzi w bundlu frontendu), ale trzymamy go jako sekret Workera, żeby nie commitować żadnych wartości.

### 3.2. Klucze w KV

- `username:<nazwa>` → `{"uid":"...","email":"..."}` — autorytatywna mapa nazwa→konto.
- `uid:<uid>` → `<nazwa>` — odwrotna mapa do zmiany nazwy (stara nazwa jest usuwana).
- `rl:<scope>:<klucz>:<minuta>` → licznik rate limitu (TTL 120 s).

Uwaga: KV jest eventually consistent — teoretyczny wyścig dwóch rejestracji tej samej nazwy w tej samej sekundzie może przejść; przy tej skali to akceptowalne (pierwszy zapis i tak wygrywa po propagacji, logowanie zawsze weryfikuje hasło w Firebase). Z tego samego powodu rate limiting na KV jest best-effort — dodatkowo próby haseł limituje sam Firebase. Przy nieistniejącej nazwie endpoint logowania wykonuje porównywalne czasowo żądanie „dummy" do Firebase, żeby czas odpowiedzi nie zdradzał istnienia nazwy (wnioski z przeglądu bezpieczeństwa 2026-07-19).

### 3.3. Kod modułu (wklej jako `src/authUsername.js` w repo Workera)

```js
// Logowanie nazwą użytkownika — Event Times.
// Zasady bezpieczeństwa:
// - e-mail przypisany do nazwy NIGDY nie wychodzi bez poprawnego hasła
//   (Worker najpierw weryfikuje hasło w Firebase REST, dopiero potem zwraca e-mail),
// - odpowiedzi błędne są jednakowe dla "zła nazwa" i "złe hasło" (utrudnia enumerację),
// - hasła nie są nigdzie zapisywane ani logowane,
// - rejestracja/zmiana nazwy wymaga ważnego Firebase ID tokena (RS256 + JWKS Google).

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,19}$/

const JSON_HEADERS = { 'Content-Type': 'application/json' }

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  })
}

// --- Rate limiting (best-effort na KV; Firebase dodatkowo limituje próby haseł) ---

async function enforceRateLimit(env, scope, subject, limit) {
  const minute = Math.floor(Date.now() / 60000)
  const key = `rl:${scope}:${subject}:${minute}`
  const current = Number(await env.AUTH_KV.get(key)) || 0

  if (current >= limit) {
    return false
  }

  await env.AUTH_KV.put(key, String(current + 1), { expirationTtl: 120 })
  return true
}

function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown'
}

// --- Weryfikacja Firebase ID tokena (bez service accounta, przez publiczne JWKS) ---

let jwksCache = null
let jwksCacheExpiry = 0

async function getFirebaseJwks() {
  if (jwksCache && Date.now() < jwksCacheExpiry) {
    return jwksCache
  }

  const response = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  )

  if (!response.ok) {
    throw new Error('jwks-fetch-failed')
  }

  jwksCache = await response.json()
  const cacheControl = response.headers.get('Cache-Control') ?? ''
  const maxAge = Number(/max-age=(\d+)/.exec(cacheControl)?.[1] ?? 3600)
  jwksCacheExpiry = Date.now() + Math.min(maxAge, 21600) * 1000
  return jwksCache
}

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function decodeJwtPart(part) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)))
}

export async function verifyFirebaseIdToken(token, projectId) {
  const parts = token.split('.')

  if (parts.length !== 3) {
    return null
  }

  let header
  let payload

  try {
    header = decodeJwtPart(parts[0])
    payload = decodeJwtPart(parts[1])
  } catch {
    return null
  }

  if (header.alg !== 'RS256' || !header.kid) {
    return null
  }

  const jwks = await getFirebaseJwks()
  const jwk = jwks.keys.find((key) => key.kid === header.kid)

  if (!jwk) {
    return null
  }

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    base64UrlToBytes(parts[2]),
    signed,
  )

  if (!valid) {
    return null
  }

  const now = Math.floor(Date.now() / 1000)

  if (
    typeof payload.exp !== 'number' ||
    payload.exp <= now ||
    typeof payload.iat !== 'number' ||
    payload.iat > now + 300 ||
    payload.aud !== projectId ||
    payload.iss !== `https://securetoken.google.com/${projectId}` ||
    typeof payload.sub !== 'string' ||
    !payload.sub
  ) {
    return null
  }

  return payload
}

// --- POST /api/auth/username-login  { username, password } -> { email } ---

async function verifyPasswordWithFirebase(env, email, password) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.FIREBASE_WEB_API_KEY}`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    },
  )

  return response.ok
}

export async function handleUsernameLogin(request, env) {
  const genericError = json(401, { error: 'invalid-credentials' })

  const allowedByIp = await enforceRateLimit(env, 'ulogin', getClientIp(request), 10)

  if (!allowedByIp) {
    return json(429, { error: 'too-many-requests' })
  }

  let body

  try {
    body = await request.json()
  } catch {
    return genericError
  }

  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!USERNAME_PATTERN.test(username) || !password) {
    return genericError
  }

  // Limit GLOBALNY per nazwa (niezależny od IP) — utrudnia rozproszony brute-force
  // hasła znanej nazwy z wielu adresów.
  const allowedByName = await enforceRateLimit(env, 'ulogin-name', username, 10)

  if (!allowedByName) {
    return json(429, { error: 'too-many-requests' })
  }

  const record = await env.AUTH_KV.get(`username:${username}`, 'json')

  // Weryfikacja hasła w Firebase ZANIM ujawnimy e-mail. Dla nieistniejącej nazwy
  // wykonujemy porównywalne czasowo żądanie "dummy", żeby czas odpowiedzi nie
  // zdradzał, czy nazwa istnieje (wyrównanie timing side-channel).
  const email = record && typeof record.email === 'string' ? record.email : null
  const passwordOk = await verifyPasswordWithFirebase(
    env,
    email ?? 'nieistniejacy-uzytkownik@invalid.example',
    password,
  )

  if (!email || !passwordOk) {
    return genericError
  }

  return json(200, { email })
}

// --- POST /api/auth/username  (Authorization: Bearer <idToken>)  { username } ---

export async function handleUsernameRegister(request, env) {
  const allowed = await enforceRateLimit(env, 'uregister', getClientIp(request), 5)

  if (!allowed) {
    return json(429, { error: 'too-many-requests' })
  }

  const authHeader = request.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return json(401, { error: 'unauthorized' })
  }

  let payload

  try {
    payload = await verifyFirebaseIdToken(token, env.FIREBASE_PROJECT_ID)
  } catch {
    payload = null
  }

  if (!payload) {
    return json(401, { error: 'unauthorized' })
  }

  const email = typeof payload.email === 'string' && payload.email ? payload.email : null

  if (!email) {
    return json(400, { error: 'email-required' })
  }

  let body

  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'invalid-body' })
  }

  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''

  if (!USERNAME_PATTERN.test(username)) {
    return json(400, { error: 'invalid-username' })
  }

  const existing = await env.AUTH_KV.get(`username:${username}`, 'json')

  if (existing && existing.uid !== payload.sub) {
    return json(409, { error: 'username-taken' })
  }

  const previousUsername = await env.AUTH_KV.get(`uid:${payload.sub}`)

  if (previousUsername && previousUsername !== username) {
    await env.AUTH_KV.delete(`username:${previousUsername}`)
  }

  await env.AUTH_KV.put(`username:${username}`, JSON.stringify({ uid: payload.sub, email }))
  await env.AUTH_KV.put(`uid:${payload.sub}`, username)

  return json(200, { username })
}
```

### 3.4. Routing (w istniejącym routerze Workera)

Obie ścieżki muszą przechodzić przez **istniejącą obsługę CORS** (allowlista `http://localhost:5173` i `https://baginson.github.io`), tak samo jak `/api/ticketmaster/*` i `/api/travel-time`:

```js
import { handleUsernameLogin, handleUsernameRegister } from './authUsername'

// wewnątrz dispatch po metodzie/ścieżce:
if (request.method === 'POST' && pathname === '/api/auth/username-login') {
  return handleUsernameLogin(request, env)
}

if (request.method === 'POST' && pathname === '/api/auth/username') {
  return handleUsernameRegister(request, env)
}
```

Nie loguj (`console.log`) treści body tych żądań — zawierają hasła.

## 4. Frontend — kontrakt

- `POST /api/auth/username-login` `{username, password}` → `200 {email}` / `401` generyczne / `429`.
- `POST /api/auth/username` `{username}` + `Authorization: Bearer <idToken>` → `200 {username}` / `409` zajęta / `401` / `400` / `429`.
- Klient: `src/services/usernameService.ts`; walidacja/normalizacja: `src/utils/username.ts` (te same reguły co `USERNAME_PATTERN` wyżej: 3-20 znaków, `[a-z0-9._-]`, start od litery/cyfry, lowercase).
- Po udanej rejestracji nazwy klient zapisuje kopię do `users/{uid}.username` (tylko do wyświetlania; autorytatywna mapa jest w KV).

## 5. Ręczna checklista łączenia kont (po deployu)

1. Rejestracja e-mail+hasło → wylogowanie → logowanie e-mailem i nazwą użytkownika (po jej ustawieniu w profilu).
2. Konto Google → „Ustaw hasło" w profilu → wylogowanie → logowanie e-mailem+hasłem → ten sam profil/uid (te same polubienia).
3. Konto Google → logowanie GitHubem z tym samym e-mailem → komunikat o istniejącym koncie → logowanie Google → automatyczne połączenie → od tej pory GitHub loguje bezpośrednio na ten sam uid.
4. Profil → „Metody logowania": Połącz GitHub / Połącz Google działa; „Odłącz" znika, gdy zostaje jedna metoda.
5. „Nie pamiętam hasła" → e-mail resetu przychodzi; komunikat zawsze neutralny.
6. Nazwa użytkownika: zajęta nazwa → komunikat; zła nazwa/hasło przy logowaniu → jeden generyczny komunikat; limit prób → komunikat o zbyt wielu próbach.
7. Konto GitHub bez publicznego e-maila: jeżeli GitHub nie udostępni e-maila, Firebase może odmówić — sprawdź komunikat (frontend pokazuje ogólny błąd; to ograniczenie GitHub OAuth).

Uwaga dot. istniejących danych: jeżeli w bazie są już DWA osobne konta Firebase z tym samym e-mailem (historycznie), nie scalamy ich automatycznie — użytkownik loguje się jak dotąd; ewentualna migracja danych to osobna, ręczna operacja.
