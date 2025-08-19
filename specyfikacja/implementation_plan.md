# Plan implementacji aplikacji gry PIES

## Faza 1: Podstawowe komponenty UI i nawigacja

### 1.1 Ekran główny (Home Screen)
- Implementacja głównego interfejsu z czterema przyciskami:
  - ➕ Nowa gra - utworzenie nowego pokoju gry
  - 🎮 Dołącz do gry - wprowadzenie kodu pokoju lub quick match
  - 📖 Zasady gry - wyświetlenie zasad w formie interaktywnej
  - ⚙️ Ustawienia - konfiguracja aplikacji
- Stylowanie zgodne z designem z design_aplikacji.png
- Responsywny layout dla różnych rozdzielczości

### 1.2 System nawigacji
- Routing między ekranami (React Router/Next.js routing)
- Animacje przejść między ekranami
- Back button handling

### 1.3 Ekran ustawień
- Wybór języka (PL/EN)
- Ustawienia dźwięków i powiadomień
- Wybór motywów (jasny/ciemny)
- Ustawienia avatara użytkownika

## Faza 2: System autoryzacji i użytkowników

### 2.1 Integracja z AWS Cognito
- Formularz rejestracji z walidacją
- Formularz logowania
- Reset hasła
- Profil użytkownika (nick, avatar)

### 2.2 Zarządzanie sesją użytkownika
- Przechowywanie stanu logowania
- Auto-login przy ponownym otwarciu aplikacji
- Wylogowanie

## Faza 3: System kart i logika gry

### 3.1 Komponenty kart
- Komponent pojedynczej karty (Card)
- System grafik kart (9, 10, J, Q, K, A dla każdego koloru)
- Animacje kart (flip, move, highlight)
- Stan kart (dostępna/niedostępna/wybrana)

### 3.2 Silnik gry (Game Engine)
- Klasa GameState do zarządzania stanem gry
- Logika rozdawania kart (6 kart na gracza)
- Walidacja ruchów zgodnie z zasadami:
  - Przebijanie wyższą kartą tego samego koloru
  - Przebijanie Damą Trefl
  - Wymuszenie dołożenia drugiej karty po przebiciu
  - Logika "Budy" gdy brak możliwości przebicia
- System przypisywania kolorów po zagraniu Damy Trefl
- Detekcja końca tury i gry

### 3.3 Walidacja ruchów
- Sprawdzanie legalności zagranej karty
- Podświetlanie dostępnych kart
- Przyciemnianie niedostępnych kart
- Komunikaty o błędnych ruchach

## Faza 4: Interfejs gry

### 4.1 Główny ekran gry (Game Board)
- Layout zgodny z designem:
  - Stół (centrum) - ostatnio zagrane karty
  - Ręka gracza (dół) - karty w wachlarzu
  - Panel statusu (góra) - informacje o turze
  - Gracze przeciwnicy (boki) - liczba kart i kolory

### 4.2 Panel statusu gry
- Wskaźnik czyja kolej (podświetlenie aktywnego gracza)
- Wyświetlanie przypisanych kolorów przy nickach
- Informacja o etapie gry ("Ustalanie kolorów", "Runda 2", etc.)
- Timer tury (opcjonalnie)

### 4.3 Przyciski akcji
- "Weź Budę" (aktywny gdy nie można przebić)
- "Potwierdź ruch" (zabezpieczenie przed przypadkowym zagraniem)
- Drag & drop kart na stół

### 4.4 System animacji
- Animacja ruchu karty ze ręki na stół
- Efekt zbierania Budy (karty przesuwają się do gracza)
- Animacje rozdawania kart na początku gry
- Efekty przejścia między turami

## Faza 5: System multiplayer (Real-time)

### 5.1 Backend - GraphQL API (AWS AppSync)
- Schema GraphQL dla:
  - Game (id, status, players, cards, currentTurn)
  - Player (id, name, cards, color, isHost)
  - GameMove (playerId, cardPlayed, timestamp)
- Mutations dla akcji graczy
- Subscriptions dla real-time updates

### 5.2 DynamoDB Schema
- Struktura tabel do przechowywania stanu gier, graczy, ruchów, czatu:
  - Games Table:
    - gameId (PK)
    - status: "waiting" | "playing" | "finished"
    - players: [playerId1, playerId2, ...]
    - currentPlayer: playerId
    - gameState: JSON (aktualny stan gry)
    - createdAt, updatedAt
  - GamePlayers Table:
    - gameId (PK)
    - playerId (SK)
    - playerName, avatar, color, cards, isHost, joinedAt
  - GameMoves Table:
    - gameId (PK)
    - timestamp (SK)
    - playerId, cardPlayed, actionType, resultState

### 5.3 Lambda Functions
- createGame – tworzenie nowej gry/meczu
- joinGame – logika dołączania gracza do pokoju
- playCard – obsługa ruchu gracza i walidacji
- takeBuda – obsługa pobrania kart ze stołu
- leaveGame – obsługa rozłączania

### 5.4 Real-time komunikacja
- Subskrypcje GraphQL: informacje o ruchach, turach, stanie stołu
- Real-time czat i emotki w lobby i podczas gry (AppSync subscriptions)
- Bieżący status wszystkich graczy (przy wejściu/wyjściu)

---

## Faza 6: Lobby i matchmaking

### 6.1 Lobby gry
- Widok listy graczy w pokoju (nick, avatar, status gotowości)
- Czat tekstowy + szybkie emotki (😂 😡 👏 🐶)
- Host może rozpocząć grę, zmienić ustawienia gry/pokoju
- Możliwość kopiowania/udostępniania kodu pokoju/zapraszania znajomych
- Animacje „dołączania” nowych graczy

### 6.2 System pokojów
- Generowanie krótkich, unikalnych kodów pokojów (alfanumeryczne)
- Publiczne lobby (szybkie gry) i pokoje prywatne (gra ze znajomymi)
- Lista publicznych pokoi do gry „na szybko”
- System wyznaczania gospodarza i przekazywania hosta przy wyjściu

### 6.3 Quick Match & automatchmaking
- Kolejka do szybkiej gry (losowanie pokoju z oczekującymi)
- Automatyczne dołączanie do wolnych pokojów/przypisywanie graczy

---

## Faza 7: Funkcjonalności dodatkowe

### 7.1 Historia gier
- Zapis zakończonych gier w bazie (DynamoDB)
- Podgląd szczegółów: skład rąk, przebieg ruchów, wygrany, data i czas
- Historia własnych partii na profilu gracza i prosta przeglądarka historii

### 7.2 System rankingowy
- Liczenie punktów za miejsce, aktualizowanie rankingu po zakończonej grze
- Oddzielny ranking globalny i dla znajomych
- Widok podsumowania po każdej grze (wyniki, statystyki, kolejność, karty swojego koloru)
- System odznak (opcjonalnie)

### 7.3 Personalizacja
- Wybór avatara i skórki kart (minimalistyczne, klasyczne, humorystyczne)
- Zmiana kolorystyki stołu i tła przez gracza
- Ustawienia własnego pseudonimu do wyświetlania

### 7.4 Powiadomienia push i zaproszenia
- Powiadomienia o zaproszeniach do gry, gotowości graczy, rozpoczęciu partii
- Integracja z AWS SNS (web push + opt-in)
- Wynik gry, nagrody, znajomi dołączają do lobby (real-time/async)

---

## Faza 8: Tryb offline oraz samouczek

### 8.1 Gra z botami (single player)
- Silnik AI na różne poziomy trudności (łatwy/średni/trudny)
- Gra w układzie 1v3 z komputerem, cała logika on-device/serverless
- Zachowanie zasad gry dla botów, generowanie możliwych ruchów

### 8.2 Samouczek interaktywny
- Przewodnik krok po kroku po zasadach gry (tutorial overlay z podpowiedziami)
- Animacje, strzałki, highlighty na interfejsie (np. przy Budzie, przypisywaniu koloru)
- Mini gra demo z przykładowymi scenariuszami do rozegrania

---

## Faza 9: Optymalizacje, testy, monitoring

### 9.1 Optymalizacja wydajności
- Lazy loading grafik i komponentów
- Optymalizacja re-renderowania komponentów
- Minimalizacja wymiany danych w sieci (delta updates)

### 9.2 Testowanie i QA
- Testy jednostkowe dla logiki gry i backendu
- Testy integracyjne API, multiplayera, autoryzacji
- Testy E2E interfejsu
- Testy na różnych urządzeniach (mob, desktop, tablet)

### 9.3 Zarządzanie błędami i fallbacki
- Łagodna obsługa disconnected graczy
- Stan offline (reconnect prób, powrót do gry)
- UI dla nieobsługiwanych sytuacji i błędów w grze

### 9.4 Monitoring i analytics
- Monitoring połączeń live (AppSync/CloudWatch)
- Statystyki zaangażowania, liczba gier, zachowania użytkowników
- Error reporting

---

## Harmonogram i priorytety MVP

- **Tydzień 1-2**: Faza 1–2 (UI + autoryzacja)
- **Tydzień 3-4**: Faza 3–4 (logika gry + interfejs gry)
- **Tydzień 5-6**: Faza 5–6 (multiplayer, lobby, pokoje)
- **Tydzień 7**: Faza 7 (historia, ranking, personalizacja, powiadomienia)
- **Tydzień 8**: Faza 8 (tryb offline, tutorial)
- **Tydzień 9-10**: Faza 9 (optymalizacja, QA, analytics, release)

### Minimalne MVP:
- Rozgrywka multiplayer 4 graczy online
- UI zgodny z designem
- Autoryzacja, lobby, tryb quick game
- Gra z botami i prosty tutorial
- Historia, podstawowy ranking, personalizacja
- Desktop + mobile support, testy

---
