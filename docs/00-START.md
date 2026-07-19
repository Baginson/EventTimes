# Event Times — Start

Pulpit projektu i główny punkt wejścia do dokumentacji. Vault Obsidiana = folder `docs/`.

## Czym jest Event Times

Mapowa aplikacja do odkrywania miejsc i wydarzeń (React + Vite + TypeScript + Leaflet + Firebase Auth + Firestore + GitHub Pages). Free-first: bez Cloud Functions, bez Firebase Storage, bez płatnych API. Nie sprzedaje biletów — „Kup bilet” zawsze przekierowuje na zewnątrz.

## Mapa dokumentacji

| Dokument | Za co odpowiada |
| --- | --- |
| [[PROJECT_STATE]] | aktualny, faktyczny stan projektu |
| [[ROADMAP]] | dalsze etapy i priorytety |
| [[ARCHITECTURE]] | architektura, technologie, model danych |
| [[UI_RULES]] | obowiązujące zasady UI/UX |
| [[DECISIONS]] | chronologiczny rejestr trwałych decyzji |

Materiały wizualne i inspiracje: `design-references/` (lokalne, niecommitowane).

## Aktualny punkt pracy

Bieżące zadanie i następny krok: `tasks/NOW.md` (w katalogu `tasks/`, poza vaultem).

## Przed rozpoczęciem zadania

1. Przeczytaj [[PROJECT_STATE]].
2. Przy kontynuacji rozpoczętej pracy — najpierw `tasks/NOW.md`.
3. Dodatkowo tylko jeden lub dwa dokumenty bezpośrednio związane z zadaniem (wg mapy powyżej).

Nie czytaj całego folderu `docs/` ani całego repozytorium.

## Po zakończeniu zadania

- aktualny stan projektu → [[PROJECT_STATE]]
- rozpoczęty/zakończony etap lub zmiana priorytetów → [[ROADMAP]]
- trwała decyzja → nowy wpis na końcu [[DECISIONS]]
- [[ARCHITECTURE]] — tylko gdy architektura faktycznie się zmieniła
- [[UI_RULES]] — tylko gdy zmienia się stała zasada interfejsu
- checkpoint bieżącej pracy → `tasks/NOW.md`
