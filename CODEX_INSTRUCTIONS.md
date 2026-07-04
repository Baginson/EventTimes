# Zasady pracy nad projektem Event Times

1. Pracujemy małymi krokami.
2. Nie dodawaj Firebase, logowania, bazy danych ani hostingu bez osobnego polecenia.
3. Na pierwszym etapie aplikacja ma działać na lokalnych danych testowych.
4. Leaflet jest pierwszą biblioteką mapową, ale lokalizacje miejsc muszą być przechowywane jako niezależne współrzędne `lat` i `lng`.
5. Nie zapisuj pozycji markerów jako pikseli, pozycji ekranu, pozycji kafelków mapy (`tile position`) ani obiektów specyficznych dla Leaflet.
6. Każdą większą zmianę opisz krótko po jej wykonaniu.
7. Nie usuwaj istniejącej dokumentacji projektu.
8. Nie instaluj nowych paczek bez wyjaśnienia, po co są potrzebne.
9. Priorytetem MVP jest mapa Leszna, pinezki miejsc, panel miejsca po kliknięciu i lokalne dane testowe.
10. Kod ma być czytelny, podzielony na komponenty i przygotowany pod późniejsze podłączenie Firebase.
