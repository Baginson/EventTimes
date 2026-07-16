# Event Times

Event Times to mapowa aplikacja webowa do odkrywania miejsc eventowych i wydarzeń.

## Dokumentacja

- `docs/ARCHITECTURE.md` — stack, model danych, warstwa usług, Firebase.
- `docs/UI_RULES.md` — system designu (kolory, typografia, panele, animacje, dostępność).
- `docs/PROJECT_STATE.md` — co działa, co jest częściowe, znane problemy, priorytety.
- `docs/DECISIONS.md` — rejestr decyzji technicznych.
- `docs/ROADMAP.md` — plan etapów.
- `AGENTS.md` — zasady dla agentów AI pracujących w repo.

## Stack

- React + Vite + TypeScript
- Leaflet / React Leaflet
- Firebase Authentication
- Firestore
- GitHub Pages

Projekt jest prowadzony w trybie free-first. Nie używamy Cloud Functions, Firebase Storage, Google Maps API, Google Places API ani innych funkcji wymagających płatnego planu Blaze.

## Konfiguracja lokalna

1. Skopiuj `.env.example` do `.env.local`.
2. Uzupełnij wartości Firebase:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Opcjonalnie — import wydarzeń z Ticketmaster w panelu admina (funkcja jest ukryta, gdy klucz nie jest ustawiony):

```env
VITE_TICKETMASTER_API_KEY=your_ticketmaster_api_key
```

Klucz trzymaj wyłącznie w `.env.local` (lokalnie) i w GitHub Actions Secrets (produkcja). Nigdy w kodzie ani w repozytorium.

3. Uruchom:

```bash
npm install
npm run dev
```

`.env.local` nie może być commitowany.

## Admin

Admin nie jest ustawiany przez e-mail w kodzie frontendu.

Aplikacja sprawdza, czy dla zalogowanego użytkownika istnieje dokument:

```text
admins/{uid}
```

Dokument admina utwórz ręcznie w Firebase Console. Może być pusty albo zawierać pomocnicze pola, np. `createdAt`.

## Firestore

Publiczne dane aplikacji są przechowywane w kolekcjach:

- `venues`
- `events`

Każdy może je czytać. Tworzenie, edycja i usuwanie są dozwolone tylko dla admina według reguł Firestore.

Reguły znajdują się w pliku `firestore.rules`.

## GitHub Pages

Workflow deployu znajduje się w:

```text
.github/workflows/deploy.yml
```

W repozytorium GitHub dodaj sekrety:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

W GitHub Settings → Pages ustaw:

- Source: GitHub Actions

Po publikacji dodaj domenę GitHub Pages w Firebase:

Firebase Console → Authentication → Settings → Authorized domains

Dodaj:

```text
baginson.github.io
```

Jeśli nazwa konta GitHub jest inna, dodaj domenę w formacie:

```text
twoj-login.github.io
```
