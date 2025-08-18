Projekt aplikacji mobilnej do gry PIES
1. Ogólny koncept
   Aplikacja umożliwia rozgrywkę online w czasie rzeczywistym dla 4 graczy.
   Każdy gracz widzi swoje karty na ręce, pole gry (stół), a także podstawowe informacje o przebiegu tury.
   Rozgrywka jest w pełni zautomatyzowana: aplikacja sprawdza legalność ruchów, rozdaje karty, przypisuje kolory i obsługuje „Budę”.
2. Główne elementy aplikacji
   2.1. Ekran główny
   Przyciski:
   „➕ Nowa gra”
   „🎮 Dołącz do gry” (kod stołu lub szybkie losowanie)
   „📖 Zasady gry” (interaktywna instrukcja i samouczek)
   „⚙️ Ustawienia” (język, motywy, dźwięki, powiadomienia)
   2.2. Lobby gry
   Informacja o graczu (nick, avatar, kolor ramki dla przypisanego koloru w trakcie gry).
   Możliwość zapraszania znajomych (link/kod stołu).
   Czatu tekstowego i emotki/reakcje.
   Host gry może rozpocząć partię po dołączeniu 4 graczy.
   2.3. Interfejs gracza podczas gry
   Układ przypomina inne gry karciane online (np. Uno, Tysiąc):
   Główne elementy:
   Stół (centralna część ekranu):
   Widoczne ostatnio zagrane karty.
   Licznik kart u każdego gracza (nie widać ich treści, tylko liczba).
   Ikona „Budy”, jeśli ktoś musiał zebrać stół.
   Ręka gracza (dół ekranu):
   Karty ułożone wachlarzem, można kliknąć kartę aby zagrać.
   Karty niedostępne (np. nie do przebicia) są przyciemnione, a aplikacja podpowiada możliwe ruchy.
   Panel statusu (góra ekranu):
   Czyja kolej.
   Przypisane kolory (ikona symbolu obok nicku każdego gracza).
   Informacja o aktualnym etapie (np. „Ustalanie kolorów”, „Runda 2”, „Tura Kuby”).
   Przyciski akcji (prawy dolny róg):
   „Weź Budę” (aktywny tylko, jeśli gracz nie może zagrać).
   „Potwierdź ruch” (aby uniknąć przypadkowego zagrania).
   Czat/emotki (lewy dolny róg):
   Szybkie reakcje (😂 😡 👏 🐶).
   Możliwość krótkich wiadomości tekstowych.
3. Przebieg rozgrywki w aplikacji
1. Rozdanie kart – aplikacja rozdaje karty (24 sztuki, po 6 na gracza).
2. Pierwsza tura – startuje losowy gracz, zagrywając 9 karo.
3. Kolejność ruchów – wskazówka na ekranie pokazuje, kto gra.
4. Ruch gracza:
   wybór karty do przebicia (jeśli jest możliwość),
   aplikacja automatycznie wymusza dołożenie drugiej karty, jeśli gracz się przebił,
   jeśli brak możliwości przebicia → aplikacja podświetla przycisk „Weź Budę” i przenosi wszystkie karty ze stołu na rękę gracza.
5. Przypisanie kolorów – jeśli ktoś zagra Damę Trefl, aplikacja przypisuje kolory do graczy (wyświetla to przy ich nickach).
6. Koniec tury – aplikacja automatycznie sprawdza, kto został z kartami, i każe temu graczowi odrzucić najniższą kartę swojego koloru.
7. Kolejne tury – rozpoczyna gracz po lewej stronie przegranego.
8. Koniec gry – aplikacja zatrzymuje grę, gdy ktoś musi odrzucić Asa. Wyświetla statystyki (kolejność, liczba kart swojego koloru).
4. Funkcjonalności dodatkowe
   Samouczek interaktywny – mini-partia dla jednego gracza z botami, pokazująca krok po kroku zasady (ze strzałkami i komunikatami).

Tryb offline – możliwość gry z botami (różne poziomy trudności AI).
Historia partii – zapis rozegranych gier i wyników.
Powiadomienia push – np. „Twoi znajomi czekają na Ciebie w grze PIES!”.
Personalizacja – zmiana wyglądu kart (skórki: klasyczne, minimalistyczne, humorystyczne), avatarów, kolorów stołu.
Ranking online – globalna i ze znajomymi.
5. Architektura techniczna (skrótowo)
   Front-end: React Native / Flutter (cross-platform iOS + Android).
   Back-end: Node.js + WebSockety (real-time multiplayer).
   Baza danych: PostgreSQL / Firebase (użytkownicy, statystyki).
   Hosting: AWS / Google Cloud (serwer gier, autoryzacja).
   Matchmaking: system pokoi (publiczne/prywatne) + tryb „gra ze znajomymi”.
6. Design UI (propozycja stylu)
   Motyw ciemny z kontrastowymi kolorami kart (podobnie jak Hearthstone czy Uno Online).
   Minimalistyczne ikony kart (np. ♠ ♥ ♦ ♣), czytelne oznaczenia kolorów przypisanych do graczy.
   Animacje:
   ruch karty na stół,
   efekt zbierania Buda (cały stół przesuwa się do gracza),
   celebracja przy zakończeniu gry (wybuch konfetti, szczekający piesek 🐶 jako easter egg).