# Event Times

## Opis projektu

Event Times to aplikacja webowa będąca mapą wydarzeń. Sposób jej obsługi ma być podobny do Google Maps, ale aplikacja będzie skupiona na miejscach, w których odbywają się eventy, oraz na przypisanych do nich wydarzeniach.

Pierwsza wersja aplikacji obejmuje wyłącznie Leszno.

## Mapa i miejsca wydarzeń

Głównym elementem aplikacji jest mapa Leszna z pinezkami oznaczającymi miejsca eventowe, między innymi:

- MOK Leszno,
- Hala Trapez,
- Stadion im. Alfreda Smoczyka,
- Rynek w Lesznie,
- inne lokalne miejsca wydarzeń.

## Niezależność od dostawcy mapy

Leaflet będzie pierwszą biblioteką mapową używaną w projekcie, ale Event Times nie może być z nią trwale związany. W przyszłości aplikacja może przejść na inną bibliotekę lub innego dostawcę mapy bez konieczności zmiany modelu danych miejsc.

Lokalizacja każdego miejsca i każdej pinezki musi być zapisywana jako niezależne współrzędne geograficzne:

```ts
coordinates: {
  lat: number
  lng: number
}
```

Nie wolno zapisywać położenia pinezek jako pozycji na ekranie, współrzędnych pikselowych, numerów kafelków mapy ani obiektów specyficznych dla Leaflet.

Dane miejsca są jedynym źródłem prawdy o jego lokalizacji. Leaflet odpowiada wyłącznie za wyświetlenie tych danych na mapie.

Leaflet przyjmuje współrzędne w kolejności `lat, lng`. Niektóre inne formaty i narzędzia, na przykład GeoJSON lub Mapbox, mogą używać kolejności `lng, lat`. Ewentualna zamiana kolejności lub inna konwersja musi odbywać się wyłącznie w warstwie adaptera mapy, a nie w danych miejsca.

## Panel miejsca

Po kliknięciu pinezki użytkownik zobaczy panel wybranego miejsca.

Na komputerze panel wysuwa się z prawej strony ekranu. Na telefonie wysuwa się od dołu, aby zachować wygodną obsługę mapy na mniejszym ekranie.

Panel miejsca zawiera:

- nazwę miejsca,
- adres,
- opis,
- listę przypisanych wydarzeń.

Wydarzenia są podzielone według ich aktualnego stanu na:

- nadchodzące,
- trwające,
- minione.

## Event details panel

Kliknięcie pinezki na mapie otwiera panel wybranego miejsca. Panel miejsca pokazuje podstawowe informacje o obiekcie oraz listę przypisanych do niego eventów.

Kliknięcie eventu na tej liście otwiera panel szczegółów eventu. Ten sam panel otwiera się bezpośrednio po kliknięciu eventu w wynikach wyszukiwania.

Panel szczegółów eventu pokazuje:

- nazwę eventu,
- datę,
- typ wydarzenia,
- miejsce,
- opis,
- źródło informacji,
- link do biletu, jeśli jest dostępny.

Akcje „Kup bilet”, „Chcę iść”, „Byłem” i „Zapisz” są planowane do dalszego rozwoju. W MVP mogą być widoczne jako placeholdery, bez Firebase, logowania i zapisywania danych użytkownika.

## Dostęp bez konta

Przeglądanie mapy, miejsc i wydarzeń nie wymaga zakładania konta ani logowania.

Konto będzie potrzebne do korzystania z funkcji osobistych:

- „Byłem”,
- „Chcę iść”,
- „Ulubione”,
- zapisane eventy,
- historia odwiedzonych wydarzeń.

## Bilety

Event Times nie sprzedaje biletów bezpośrednio. Przy wydarzeniu może pojawić się przycisk „Kup bilet”, który przekierowuje użytkownika do zewnętrznej strony, na przykład platformy biletowej lub strony organizatora.

## UI direction

Event Times ma łączyć prostotę Google Maps z plakatowym, miejskim stylem i wyrazistym charakterem aplikacji eventowej.

Układ mapy jest inspirowany Google Maps:

- mapa stanowi główne tło aplikacji,
- pasek wyszukiwania jest pływającym elementem nad mapą,
- użytkownik ma dostęp do szybkich filtrów,
- panel miejsca lub wydarzenia pojawia się po prawej stronie na desktopie,
- na urządzeniach mobilnych panel działa jako bottom sheet.

Nie kopiujemy Google Maps 1:1. Google Maps jest inspiracją dla prostoty obsługi i organizacji układu, a nie wzorem identycznego wyglądu.

Warstwa wizualna Event Times jest inspirowana miejskimi plakatami i wyrazistym brandingiem. Wykorzystuje mocny electric blue, kremowe tła, grubą typografię oraz karty wydarzeń przypominające mini plakaty lub bilety.

Grube, plakatowe litery są przeznaczone wyłącznie dla najważniejszych tytułów i elementów marki:

- logo Event Times,
- nazwy miejsc,
- nazwy eventów,
- ewentualnie wyróżnione tytuły kart.

Plakatowej typografii nie należy stosować do zwykłych informacji:

- dat,
- godzin,
- adresów,
- opisów,
- formularzy,
- tekstów pomocniczych,
- danych technicznych,
- treści panelu admina.

Opisy, adresy, daty, formularze oraz pozostałe informacje powinny korzystać ze spokojnego i czytelnego fontu UI.

Podstawowa paleta kolorów:

- Primary Blue: `#064BFF`,
- Deep Navy: `#07142F`,
- Cream: `#FFF1C7`,
- Soft Cream: `#FFF8E6`,
- White: `#FFFFFF`,
- Light Border: `#E3E8F2`,
- Muted Text: `#64748B`,
- Accent Yellow: `#FFE15A`,
- Danger Red: `#EF4444`.

Interfejs powinien być czytelny, szybki, prosty i mapowy, ale jednocześnie zachowywać wyrazisty eventowy charakter.

Panel admina w MVP może być bardziej techniczny i spokojniejszy wizualnie. Nadal powinien korzystać z kolorystyki i ogólnej spójności Event Times, bez stosowania plakatowej typografii w formularzach i danych technicznych.

## Search architecture

Wyszukiwarka ma dwa niezależne tryby: „Miejsca” i „Wydarzenia”. Tryby nie mieszają swoich typów ani wyników.

- Miejsca mają osobny typ miejsca, a wyszukiwanie tekstowe obejmuje wyłącznie nazwę miejsca.
- Wydarzenia mają osobny typ wydarzenia, a wyszukiwanie tekstowe obejmuje wyłącznie nazwę wydarzenia.
- Filtr daty dotyczy tylko wydarzeń.
- MVP skupia się na Lesznie, ale stan wybranego miasta i logika filtrowania mają umożliwić późniejsze dodanie kolejnych miast.
- Kliknięcie wyniku miejsca otwiera panel tego miejsca na mapie.
- Kliknięcie wyniku wydarzenia otwiera panel miejsca, w którym odbywa się to wydarzenie.

## Temporary admin panel and local data storage

Na etapie MVP panel admina jest dostępny z przycisku w interfejsie aplikacji. Jest to tymczasowe rozwiązanie developerskie, służące do rozwijania i testowania projektu bez backendu. W przyszłości dostęp do panelu zostanie ograniczony do zalogowanego konta z uprawnieniami administratora.

Panel admina pozwala:

- dodawać i edytować miejsca,
- przesuwać pinezki poprzez zmianę `coordinates.lat` i `coordinates.lng`,
- dodawać i edytować wydarzenia.

Na etapie MVP aktualna lista miejsc i wydarzeń jest zapisywana lokalnie w `localStorage`. Dane z `mockVenues.ts` i `mockEvents.ts` pełnią rolę danych startowych:

- jeśli `localStorage` jest pusty, aplikacja używa danych mockowych,
- jeśli `localStorage` zawiera dane, aplikacja używa zapisanej lokalnie listy.

Obsługa danych musi pozostać oddzielona od komponentów UI. Komponenty nie powinny bezpośrednio odczytywać ani zapisywać `localStorage`. Operacje na danych wykonuje osobna warstwa usług, na przykład `venueService` i `eventService`.

Docelowo implementacja tych usług zostanie podmieniona na Firebase/Firestore. Po tej zmianie wspólne dane miejsc i wydarzeń będą dostępne dla wszystkich użytkowników strony, a nie tylko w jednej przeglądarce.

Leaflet pozostaje wyłącznie warstwą wyświetlania mapy. Źródłem prawdy o lokalizacji miejsca są niezależne współrzędne geograficzne `coordinates.lat` i `coordinates.lng`.

## Dane i materiały

W początkowej wersji miejsca i wydarzenia będą dodawane ręcznie.

Zdjęcia oraz grafiki nie są wymagane w MVP. W przyszłości można zwrócić się do lokalnych obiektów i organizatorów z prośbą o zgodę na wykorzystanie ich oficjalnych materiałów.

## MVP

Pierwszym celem projektu jest przygotowanie wersji obejmującej:

- mapę Leszna,
- kilka pinezek miejsc,
- panel miejsca wyświetlany po kliknięciu pinezki,
- listę eventów przypisaną do miejsca,
- dane testowe zapisane lokalnie w kodzie,
- brak Firebase na pierwszym etapie.
