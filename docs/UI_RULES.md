# Event Times — Zasady UI / UX

Utrwalone źródło prawdy dla zasad projektowych. (Oryginalny `docs/EVENT_TIMES_UI_RULES.md` został scalony z tym plikiem i usunięty 2026-07-16 — do odzyskania z historii git.)

## 1. Kierunek wizualny

Edytorska aplikacja mapowa + plakat eventowy. Odważna, ale czytelna, wyróżniający się lokalny produkt premium — nie generyczny szablon SaaS, nie glassmorphism, nie ciężkie gradienty, nie stockowy wygląd dashboardu.

**Esencja marki** (z posteru produktu w `docs/design-references/`, folder local-only): "Mapa wydarzeń. Miejsca. Ludzie. Wszystko w jednym." / "Odkrywaj. Przeżywaj. Wracaj." Krótkie hasła w trybie rozkazującym, duży blokowy electric-blue wordmark na kremie albo papierowej fakturze, produktowe elementy typu wycinki/naklejki, powtarzany tekst jako graficzny pattern, niebieskie akcenty taśmy. Mockupy UI z posteru (pływający prawy panel venue z grupami Nadchodzące/Minione, mobile bottom sheet, search jako górny punkt wejścia) pasują do zaimplementowanej aplikacji — traktuj ten poster jako referencję tego, jak Event Times powinno się *czuć*, nigdy jako layout do kopiowania 1:1.

`docs/design-references/README.md` (local-only, gitignored — obrazy referencyjne zawierają prace marek zewnętrznych) wyjaśnia, co brać z każdego obrazu, a czego nie kopiować. Jeśli pracujesz na maszynie bez tego folderu, ta sekcja jest streszczeniem.

## 2. Kolory

**Paleta główna (decyzja 2026-07-18 — kierunek użytkownika):** niebieski, biały, czarny i szarości są rdzeniem kolorów UI. Krem i żółty są **wycofane dla nowych powierzchni** — nie używaj ich w nowym ani redesignowanym UI. Czerwony zostaje tylko dla akcji destrukcyjnych.

- Electric Blue `#064BFF` (`--color-primary`) — aktywne elementy, CTA, wybrane pinezki, badges, powierzchnie brandowe (np. karta profilu), stickers/labels.
- White `#FFFFFF` (`--color-white`) — karty, panele, powierzchnie treści, tekst na niebieskim.
- Ink `#10131A` (`--color-ink`) — prawie czarny tekst główny/cyfry na jasnych powierzchniach.
- Grays: Surface `#F4F6F9` (`--color-surface`, jasne tło sekcji), Light Border `#E3E8F2`, Muted Text `#64748B`, Ink Soft `#344159` (tekst drugorzędny).
- Deep Navy `#07142F` (`--color-navy`) — legacy kolor bazowy, nadal używany na pinezkach/panelach mapy; dla nowego tekstu na jasnych powierzchniach preferuj Ink.
- Danger Red `#EF4444` — tylko akcje destrukcyjne.
- **Legacy, nie używać w nowych pracach:** Cream `#FFF1C7`, Soft Cream `#FFF8E6`, Accent Yellow `#FFE15A`. Istniejące powierzchnie map/venue/event używające jeszcze kremu będą migrowane oportunistycznie (śledzone w ROADMAP), nie jednym dużym passem.
- Nie dodawaj nowych kolorów bez mocnego powodu.

Profil ("Karnet Event Times") jest implementacją referencyjną nowej palety: electric-blue pass card z białym tekstem/elementami, jasnoszara kolumna kolekcji z białymi kartami, ink headings, niebieskie stickers/labels.

**Tokeny są obowiązkowe**: kolory, radii (`--radius-sm/xs/md/lg/xl/pill`) i shadows (`--shadow-soft/float/panel/button/button-soft/cta`) pochodzą z `:root` w `src/index.css`. Nigdy nie hardcoduj nowego px radius, one-off shadow ani hex gray w `App.css` — zamiast tego świadomie rozszerz zestaw tokenów (od 2026-07-17 stylesheet jest w pełni tokenizowany; utrzymaj to). `--shadow-cta` jest zarezerwowany dla pojedynczego glow głównego CTA; nie rozmywaj go na przyciski drugorzędne.

## 3. Typografia

- **Bungee** — tylko duże nazwy venues/eventów, brand headlines, kilka mocnych tytułów sekcji. Nigdy dla opisów, formularzy, dat, adresów, tooltipów, przycisków, filtrów, panelu admina ani długiego tekstu.
- **IBM Plex Sans** — opisy, dłuższy tekst, treść paneli, narrative copy.
- **Inter** — przyciski, tooltips, etykiety hover pinezek, chips, badges, counters, filtry, inputs, selects, małe controls, search dropdown, małe akcje (Nawiguj, Byłem, Chcę iść).
- Nigdy nie przełączaj całej aplikacji globalnie na Inter.

## 4. Długi tekst

Długie opisy skracają się przez "Czytaj więcej" / "Zwiń opis" (zaimplementowane zarówno w `EventPanel` [>650 znaków albo >3 akapity], jak i `VenuePanel` [>450 znaków]). Zachowuj akapity, line-height ~1.55–1.7. Brak pustej sekcji opisu, gdy nie ma opisu. Długie tytuły zawijają się (`overflow-wrap` + `text-wrap: balance` na nagłówkach paneli — bez osieroconych pojedynczych słów), nigdy nie są ucinane ani nie wychodzą poza panel.

## 5. Hierarchia UI

Każdy ekran/panel odpowiada: co to jest, gdzie to jest, kiedy to jest, co mogę zrobić. Kolejność w panelu eventu: typ, status, nazwa, data, akcja użytkownika, venue, opis, źródło, bilet (jeśli dotyczy). Kolejność w panelu venue: typ, nazwa, adres, nawigacja, opis, eventy. Nie stawiaj kilku CTA o równym ciężarze obok siebie bez jasnej hierarchii.

## 6. Mapa

Mapa zawsze ma priorytet; panele unoszą się nad nią, nigdy nie zasłaniają jej w pełni bez powodu. Pływające panele na desktopie, bottom sheet na mobile. Pinezki są minimalne: Deep Navy domyślnie, Electric Blue dla wybranej/aktywnej, subtelny ring przy hover/active, bez klasycznych numerowanych bąbli klastrów jako głównego rozwiązania.

## 7. Panele

**Desktop**: `position: fixed`, margines od góry/dołu, mapa widoczna nad i pod panelem, border-radius 24–32px, subtelny shadow/border, wewnętrzny scroll, nigdy pełnoekranowa biała ściana.

**Mobile**: bottom sheet, wygodny scroll, duże touch targets, mniej informacji naraz, nigdy desktopowy layout upchnięty na telefonie.

## 8. Panel venue

Sekcje wyrównane i spójne; liczba eventów nie może wyglądać jak przypadkowy element. Nagłówki "Nadchodzące"/"Minione" mają identyczny layout; counters i chevrons siedzą w stałych kolumnach (nie ręczne marginesy):
```css
.event-group-toggle {
  display: grid;
  grid-template-columns: 1fr auto 24px;
  align-items: center;
  gap: 12px;
}
```
Empty-events state używa prawdziwego znaku marki (`public/brand/event-times-mark.png`), nigdy placeholderowego kółka "ET".

## 9. Panel eventu

Kompaktowy i czytelny: bez ściany tekstu, data blisko tytułu, "Byłem"/"Chcę iść" wysoko (nie zakopane na dole), kompaktowa karta venue, opis tylko jeśli istnieje, źródło jako mały link, przycisk biletu tylko gdy ma sens. Bez "Zainteresowany". Serce: sama ikona, bez tekstu, prawy górny róg, wyraźny stan aktywny.

Dokładnie **jeden** przycisk powrotu, etykietowany według miejsca, z którego otwarto event (2026-07-19): z panelu venue → "Wróć do miejsca"; z profilu → "Wróć do profilu"; z search/deep linku → "Pokaż miejsce" (nawiguje wyżej do venue bez udawania powrotu). Nigdy nie pokazuj dwóch przycisków powrotu naraz.

## 10. Eventy

Status liczony dynamicznie (`ongoing`/`upcoming`/`past`), nigdy zapisywany. Nadchodzące przed minionymi; minione są archiwum, ale nadal istotne. Brak godziny dla eventów bez godziny. Opis opcjonalny, brak pustej sekcji, gdy go nie ma.

## 11. Search

Dwa tryby — Miejsca i Wydarzenia — które nigdy nie mieszają wyników. Nigdy nie pokazuje całej bazy po otwarciu: wyniki pojawiają się dopiero, gdy użytkownik wpisze tekst (min. 2 znaki), wybierze typ miejsca/eventu albo wybierze datę. Filtr daty dla eventów oferuje: Wszystkie, Dzisiaj, Jutro, Weekend, Wybierz datę (pojedynczy dzień albo zakres od–do). Zakładka eventów grupuje wyniki w Trwa teraz / Nadchodzące / Minione, bez redundantnego badge statusu na każdej karcie. Zakładka miejsc nigdy nie pokazuje wszystkiego bez filtra. Dropdown wygląda jak zaprojektowany panel, nie surowa lista, z prawdziwymi empty states i działającą strzałką rozwijania.

## 12. Formularze

Krótkie i praktyczne: wymagane tylko naprawdę potrzebne pola, opis opcjonalny, przeszłe daty dozwolone, godzina opcjonalna z opcją "Bez godziny", ludzkie komunikaty błędów (nie opierać się wyłącznie na walidacji HTML). Bez poster typography w formularzach.

## 13. Akcje użytkownika

Niezalogowany: widzi publiczne dane, "Kup bilet" (non-past + ticketUrl), "Nawiguj"; nigdy nie widzi like/want-to-go/been. Zalogowany: może polubić venue/event, oznaczyć "Chcę iść"/"Byłem". Nigdy nie przywracaj "Zainteresowany".

## 14. Admin

Praktyczny, wizualnie spokojniejszy — nie potrzebuje poster treatment. Bramkowanie `admins/{uid}`, brak haseł w kodzie, brak `VITE_ADMIN_EMAIL`, zwykli użytkownicy nigdy nie widzą panelu admina, Firestore Rules są realną granicą bezpieczeństwa.

## 15. Animacja

Pomaga, nie rozprasza. Używana dla: otwarcie/zamknięcie panelu, rozwinięcie sekcji, hover/active, zapis, loading, toasts, zmiana filtra. Nie dla: wszystkiego naraz, dużych elementów mapy bez powodu, tekstu utrudniającego czytanie. Timing: małe interakcje 120–180ms, panele/dropdowns 180–260ms, większe przejścia 260–360ms. Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`. Zawsze respektuj `@media (prefers-reduced-motion: reduce)`.

## 16. Loading

Bez starego tekstowego panelu "Ładowanie Event Times...". Początkowe ładowanie Firestore: full-screen overlay, rozmyte tło (`rgba(7, 20, 47, 0.28)`, `backdrop-filter: blur(8px)`), wyśrodkowany biały tekst "Event Times", biały spinner pod spodem (34×34px, 0.8s linear infinite), bez dużej karty, bez dodatkowego tekstu technicznego. Przy błędzie loading znika i pojawia się komunikat błędu (od Etap A z akcją retry).

## 17. Empty states

Nigdy nie pokazuj pustki bez wyjaśnienia: "Brak wydarzeń dla tego miejsca.", "Brak wyników dla wybranych filtrów.", oraz — dla adminów przy pustym Firestore — podpowiedź, by zaimportować JSON. Empty states mogą używać małego znaku marki, nigdy przeskalowanego.

## 18. Responsywność

Mobile nie jest mniejszym desktopem. Breakpointy według tej specyfikacji: mobile ≤767px, tablet 768–1023px, desktop 1024px+ — **uwaga**: obecna implementacja faktycznie używa 820px/1100px jako głównych breakpointów (zobacz `docs/PROJECT_STATE.md`), co jest znanym, śledzonym rozjazdem, jeszcze nieuzgodnionym z tą specyfikacją.

Mobile: bottom sheet, większe przyciski, większe odstępy dotykowe, mniej naraz, search jako główny punkt wejścia, admin mniej eksponowany. Desktop: pływający search, pływający prawy panel, mapa zawsze widoczna, admin/profil top-right.

## 19. Dostępność

Dobry kontrast, widoczny focus, `aria-label` na przyciskach ikonowych, wygodne touch targets, nigdy nie polegać wyłącznie na kolorze, statusy zrozumiałe jako tekst. Minimum: wysokość button/input 40–48px na mobile, obszar trafienia ikon ≥40px, body text nigdy mniejszy niż 14px.

## 20. Gdzie styl posterowy jest dozwolony

Dozwolone: grafiki promocyjne, hero/landing, empty states, badges, onboarding, sekcje "How it works", subtelna papierowa faktura, akcenty tape/sticker. Nie przesadzaj w: formularzach, panelu admina, listach wyników, mapie ani wszędzie tam, gdzie użytkownik musi szybko czytać dane.

## 21. Ostatnia zasada

Każda zmiana UI musi odpowiedzieć na trzy pytania: czy użytkownik szybciej rozumie, co widzi? Czy może łatwiej kliknąć to, czego potrzebuje? Czy wygląda to jak Event Times, a nie generyczny szablon? Jeśli nie — nie rób tej zmiany.
