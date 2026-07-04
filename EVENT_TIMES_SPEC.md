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

## Search architecture

Wyszukiwarka ma dwa niezależne tryby: „Miejsca” i „Wydarzenia”. Tryby nie mieszają swoich typów ani wyników.

- Miejsca mają osobny typ miejsca, a wyszukiwanie tekstowe obejmuje wyłącznie nazwę miejsca.
- Wydarzenia mają osobny typ wydarzenia, a wyszukiwanie tekstowe obejmuje wyłącznie nazwę wydarzenia.
- Filtr daty dotyczy tylko wydarzeń.
- MVP skupia się na Lesznie, ale stan wybranego miasta i logika filtrowania mają umożliwić późniejsze dodanie kolejnych miast.
- Kliknięcie wyniku miejsca otwiera panel tego miejsca na mapie.
- Kliknięcie wyniku wydarzenia otwiera panel miejsca, w którym odbywa się to wydarzenie.

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
