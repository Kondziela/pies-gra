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
