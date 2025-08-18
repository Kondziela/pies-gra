# Plan implementacji gry „Pies” – Next.js + AWS Amplify
# Plan implementacji gry „Pies" – Next.js + AWS Amplify Gen 2

Dokument opisuje fazy wdrożenia gry „Pies" jako aplikacji webowej hostowanej w AWS Amplify Gen 2, z backendem zdefiniowanym w folderze `amplify/` jako TypeScript (AppSync GraphQL + DynamoDB + Lambda + Cognito) i frontendem w Next.js. Założenia logiki gry i UI wynikają z: specyfikacja/zasady_gry.md oraz specyfikacja/projekt_aplikacji.md.

Cele nadrzędne:
- Zgodność ze standardami Amplify Gen 2 (Infrastructure as Code w TypeScript, backend w folderze amplify/).
- Serwer-autorytatywna logika gry (walidacja ruchów w backendzie).
- Realtime przez AppSync GraphQL Subscriptions.
- Prostota wdrożenia i skalowalność (DynamoDB, bezserwerowe Lambda).
- Next.js (App Router) + TypeScript + SSR/ISR wspierane przez Amplify Hosting.

Environments:
- dev (domyślne do bieżącego rozwoju),
- staging (testy integracyjne/E2E),
- prod (publiczny).

Konwencje:
- Język: TypeScript.
- Node.js runtime dla Lambda: 20.x.
- Next.js: 14+ (App Router).
- Amplify Gen 2: backend w folderze `amplify/` z defineBackend().
- CDK resources w `amplify/backend/` i funkcje w `amplify/functions/`.

---

## Faza 0 — Przygotowanie repozytorium i pipeline

Cele:
- Zainicjowane repo z podstawową strukturą monorepo lub single app.
- Podstawowy CI (lint, testy) i integracja z Amplify Hosting.

Instrukcje:
- Zainicjuj projekt Next.js z TypeScript (App Router).
- Dodaj ESLint + Prettier (bez Husky dla prostoty).
- Skonfiguruj GitHub Actions (node ci: install, build, test).
- Podłącz Amplify Hosting do repo (gałąź main → prod, gałąź develop → dev).

DoD:
- Repo buduje się na CI, testy przechodzą.
- Amplify Hosting tworzy preview po PR (na gałąź dev).

---

## Faza 1 — Bootstrap Amplify Gen 2 i Auth

Cele:
- Projekt Amplify Gen 2 z backendem w folderze `amplify/`.
- Cognito (e-mail + hasło, weryfikacja emailem).

Instrukcje:
- Utwórz strukturę `amplify/backend.ts` z defineBackend().
- Zdefiniuj Auth resource z Cognito User Pool (email login, hasło, weryfikacja).
- Wygeneruj amplify_outputs.json przez `npx ampx generate outputs`.
- Zintegruj Amplify w Next.js (konfiguracja outputs, SSR aware).
- Ekrany: logowanie/rejestracja, stan zalogowania, profil (minimal).

DoD:
- Backend wdrożony przez `npx ampx sandbox`.
- Użytkownik może się zalogować i uzyskuje sesję w przeglądarce.
- SSR działa z rozpoznaniem sesji.

---

## Faza 2 — Model danych i API (AppSync GraphQL + DynamoDB)

Cele:
- Model domeny gry i pokoi/lobby.
- Schemat GraphQL z subskrypcjami.

Model domeny (wysokopoziomowo):
- Game: id, code, status (lobby/playing/finished), seats[4], turnSeat, phase, assignedColors, tableCards[], budaOwnerSeat?, winnerOrder[], createdAt/updatedAt, version.
- PlayerRef (w Game.seats): userId, displayName, seat, color?, connected, lastSeen.
- Hand: przechowywana w encji Game (mapa seat → karty) lub w osobnej encji GameHand (decyzja performance/rozmiar obiektu).
- Card: { suit: ('C'|'D'|'H'|'S'), rank: (9|10|J|Q|K|A) }.
- GameEvent (opcjonalne audyt/log): id, gameId, type, payload, ts.

Instrukcje:
- Zdefiniuj schemat GraphQL w `amplify/data/resource.ts` (Queries/Mutations/Subscriptions) dla: createGame, joinGame, startGame, playCard, takeBuda, resign, heartbeat (presence), getGame, listPublicGames; subskrypcje: onGameUpdated, onPlayerJoined, onChatMessage.
- Zaprojektuj DynamoDB model (single-table design lub oddzielne tabele):
  - Game table z GSI do listowania gier publicznych
  - Opcjonalnie GameEvents table do auditingu
- Autoryzacja resolverów: właściciel gry i członkowie pokoju; odczyt gry ograniczony do uczestników lub gier publicznych (listings).
- Włącz wersjonowanie optymistyczne (etag/version) na Game, by unikać konfliktów.

DoD:
- Amplify codegen generuje typy TS po stronie frontu.
- Można stworzyć oraz dołączyć do gry poprzez GraphQL.
- Subskrypcja onGameUpdated działa i komunikuje zmiany w lobby.

---

## Faza 3 — Silnik gry (Lambda resolvers, serwer-autorytatywnie)

Cele:
- Implementacja zasad z specyfikacja/zasady_gry.md po stronie backendu.
- Deterministyczne rozdanie i walidacja ruchów.

Zakres:
- Funkcje Lambda w `amplify/functions/` wołane przez mutacje: startGame, playCard, takeBuda.
- Mechanika:
  - Rozdanie (24 karty, 6 na gracza), losowy start lub 9♦ w pierwszej turze.
  - Walidacja zagrań: przebijanie, wymuszenie drugiej karty po przebiciu.
  - Dama Trefl: przypisanie kolorów i wyjątki.
  - Buda: zebranie stołu, blok ruchu w tej kolejce.
  - Koniec tury: kto został z kartami odrzuca najniższą kartę swojego koloru.
  - Kolejne tury: start po lewej od przegranego.
  - Koniec gry: gdy ktoś musi odrzucić Asa.
- Aktualizacje stanu gry w DynamoDB i publikacja przez AppSync.
- Odporność na konflikt równoległych mutacji (warunki wersji/wzorce idempotencji).

Testy:
- Jednostkowe (silnik, talia, walidacje).
- Integracyjne (wywołanie Lambdy z fixture'ami) w środowisku sandbox.

DoD:
- Sekwencja ruchów zgodna z zasadami, w tym edge-case'y z Damą Trefl.
- Baza zawiera poprawny stan po każdym ruchu.

---

## Faza 4 — Realtime, obecność i stabilność sesji

Cele:
- Płynne aktualizacje stołu i lobby.
- Obecność graczy i obsługa rozłączeń.

Instrukcje:
- Subskrypcje AppSync w kliencie (onGameUpdated, onPlayerJoined, onChatMessage).
- Heartbeat/lastSeen przez mutation heartbeat co N sekund; TTL lub EventBridge do sprzątania nieaktywnych.
- Rekonekt klienta do subskrypcji (exponential backoff).
- Ochrona przed podwójnymi ruchami przez blokadę tury i idempotency key w mutacjach.

DoD:
- Widoczna obecność/nieobecność graczy.
- Po odświeżeniu strony sesja i subskrypcje się odnawiają.

---

## Faza 5 — Frontend: fundamenty UI (Next.js + Amplify)

Cele:
- Szkielet aplikacji zgodny z projekt_aplikacji.md.
- Integracja auth, routing, stan globalny.

Instrukcje:
- Strony:
  - / — ekran główny: „Nowa gra", „Dołącz do gry", „Zasady", „Ustawienia".
  - /game/[code] — lobby gry (sloty graczy, zaproszenia, start).
  - /play/[gameId] — widok stołu, ręka, status, akcje, czat.
  - /rules — interaktywne zasady.
  - /settings — preferencje (język, motyw, dźwięki).
- Konfiguracja Amplify w Next.js (SSR/ISR zgodnie z hostingiem Amplify).
- Stan: React Query/Zustand/Redux (wybór), adapter do subskrypcji AppSync.
- Komponenty: Table, Hand, Card, StatusPanel, ActionButtons, Chat.
- Dostępność (klawiatura, ARIA), responsywność, theming.

DoD:
- Przepływ: utwórz pokój → dołącz → rozpocznij → przejdź do stołu.
- Render ręki gracza i możliwych ruchów (podświetlanie).

---

## Faza 6 — Frontend: logika rozgrywki i UX

Cele:
- Pełny interfejs gracza podczas gry.
- Minimalizacja błędów użytkownika (potwierdzanie ruchów).

Instrukcje:
- Integracja mutacji: startGame, playCard, takeBuda.
- Reguły UI:
  - Niedostępne karty przyciemnione wg stanu z backendu (backend autorytatywny; klient może mieć lekką weryfikację).
  - Wymuszenie drugiej karty po przebiciu (flow w UI).
  - „Weź Budę" aktywne tylko gdy wymagane.
- Animacje: ruch kart, zbieranie Buda, koniec gry (celebracja).
- Panel statusu: czyja kolej, przypisane kolory, etap, licznik rąk.

DoD:
- Pełna partia możliwa do rozegrania w 4 osoby.
- Brak nielegalnych zagrań zaakceptowanych przez backend.

---

## Faza 7 — Czat i reakcje

Cele:
- Prosty czat tekstowy i szybkie emotki.

Instrukcje:
- Mutacja sendChatMessage + subskrypcja onChatMessage z filtrem gameId.
- Moderacja minimalna (limit długości, throttling, filtrowanie podstawowe).
- UI: szybkie reakcje (😂 😡 👏 🐶) + krótkie wiadomości.

DoD:
- Wiadomości i reakcje aktualizują się w czasie rzeczywistym.

---

## Faza 8 — Tryb solo/AI i samouczek (opcjonalne w wersji 1)

Cele:
- Boty o prostych heurystykach.
- Mini-partia samouczka.

Instrukcje:
- Lambda „botEngine" nasłuchująca zmian stanu gry w EventBridge/DynamoDB Streams i wykonująca ruchy, gdy tura bota.
- Samouczek: skryptowany scenariusz, strzałki i komunikaty w UI.

DoD:
- Gra z 1–3 botami możliwa.
- Samouczek przeprowadza przez kluczowe zasady.

---

## Faza 9 — Niefunkcjonalne: bezpieczeństwo, wydajność, koszty

Bezpieczeństwo:
- Cognito + AppSync auth rules: dostęp tylko dla członków gry; listing gier publicznych ograniczony.
- Walidacja wejścia w Lambda; rate limiting na mutacje (WAF/Shield opcjonalnie).
- Szyfrowanie domyślne (DynamoDB, S3), tajemnice w SSM.

Wydajność:
- Rozmiar obiektu Game kontrolowany (opcjonalny podział na Game + GameHands).
- Indeksy dla zapytań (GSI do listowania gier).
- Minimalizacja „hot partition" (rozłożenie trafficu, ograniczenie eventów czatu).

Koszty:
- Bezserwerowe zasoby (AppSync/Lambda/DynamoDB on-demand).
- Limity TTL dla zdarzeń/czatu.

DoD:
- Audyt uprawnień przechodzi.
- Testy obciążeniowe podstawowe.

---

## Faza 10 — Testy i jakość

Testy:
- Jednostkowe (silnik, pomocnicze).
- Integracyjne (Lambda + AppSync).
- E2E (Playwright) dla kluczowych user flows.
- Snapshoty UI dla stabilności.

Jakość:
- Coverage minimalny dla krytycznych modułów (silnik).
- Lint/format na CI.
- Previews środowisk w Amplify dla PR.

DoD:
- Zielone pipeline'y na gałęziach dev/staging.
- Raporty testów dostępne w CI.

---

## Faza 11 — Wdrożenie i migracje środowisk

Instrukcje:
- Amplify Gen 2 environments: sandbox (dev) → pipeline deploy (staging/prod).
- `npx ampx sandbox` dla developmentu, `npx ampx pipeline-deploy` dla prod.
- Zmiany schematu: wersjonowanie, migracja danych (skrypty, feature flags).
- Monitoring: CloudWatch (logi Lambda), AppSync metrics, Sentry dla frontu.

DoD:
- Stabilne wdrożenie prod z monitorowaniem i alertami.

---

## Interfejsy i kontrakty API (zarys)

Mutacje:
- createGame(name?, visibility) → Game
- joinGame(code) → Game
- startGame(gameId) → Game
- playCard(gameId, card, secondCard?) → Game
- takeBuda(gameId) → Game
- heartbeat(gameId) → PresenceAck
- sendChatMessage(gameId, text|emoji) → ChatMessage

Zapytania:
- getGame(id|code) → Game
- listPublicGames() → [GameSummary]

Subskrypcje:
- onGameUpdated(gameId) → Game
- onPlayerJoined(gameId) → PlayerRef
- onChatMessage(gameId) → ChatMessage

Autoryzacja (przykład):
- Do gry: członkowie seats[seat].userId.
- Tworzenie gry: zalogowani.
- Gry publiczne: tylko listing summary bez wrażliwych danych (bez rąk).

---

## Mapowanie funkcjonalności na UI

- Ekran główny: akcje „Nowa gra", „Dołącz do gry", „Zasady", „Ustawienia".
- Lobby: nicki/avatary, zaproszenia, czat, start przez hosta.
- Stół: ostatnie karty, licznik kart graczy, ikona „Budy".
- Ręka gracza: wachlarz, podpowiedzi legalnych ruchów, potwierdzenie ruchu.
- Panel statusu: tura, przypisane kolory, etap.
- Akcje: „Weź Budę", „Potwierdź ruch".

---

## Struktura Amplify Gen 2
Dokument opisuje fazy wdrożenia gry „Pies” jako aplikacji webowej hostowanej w AWS Amplify, z backendem zdefiniowanym przez Amplify (AppSync GraphQL + DynamoDB + Lambda + Cognito) i frontendem w Next.js. Założenia logiki gry i UI wynikają z: specyfikacja/zasady_gry.md oraz specyfikacja/projekt_aplikacji.md.

Cele nadrzędne:
- Zgodność ze standardami Amplify (infrastruktura jako kod zarządzana przez Amplify, środowiska, hosting, integracja auth/API/subscriptions).
- Serwer-autorytatywna logika gry (walidacja ruchów w backendzie).
- Realtime przez AppSync GraphQL Subscriptions.
- Prostota wdrożenia i skalowalność (DynamoDB, bezserwerowe Lambda).
- Next.js (App Router) + TypeScript + SSR/ISR wspierane przez Amplify Hosting.

Environments:
- dev (domyślne do bieżącego rozwoju),
- staging (testy integracyjne/E2E),
- prod (publiczny).

Konwencje:
- Język: TypeScript.
- Node.js runtime dla Lambda: 20.x.
- Next.js: 14+ (App Router).
- Amplify: konfiguracja projektu poprzez CLI/Gen2 zgodnie z dokumentacją.

---

## Faza 0 — Przygotowanie repozytorium i pipeline

Cele:
- Zainicjowane repo z podstawową strukturą monorepo lub single app.
- Podstawowy CI (lint, testy) i integracja z Amplify Hosting.

Instrukcje:
- Zainicjuj projekt Next.js z TypeScript (App Router).
- Dodaj ESLint + Prettier + Husky (pre-commit).
- Skonfiguruj GitHub Actions (node ci: install, build, test).
- Podłącz Amplify Hosting do repo (gałąź main → prod, gałąź develop → dev).

DoD:
- Repo buduje się na CI, testy przechodzą.
- Amplify Hosting tworzy preview po PR (na gałąź dev).

---

## Faza 1 — Bootstrap Amplify i Auth

Cele:
- Projekt Amplify z wieloma środowiskami.
- Cognito (e-mail + social opcjonalnie).

Instrukcje:
- Zainicjuj Amplify w repo (środowisko dev).
- Dodaj Auth (Cognito user pool, Hosted UI, federacja opcjonalnie).
- Zintegruj Amplify w Next.js (konfiguracja klienta, SSR aware).
- Ekrany: logowanie/rejestracja, stan zalogowania, profil (minimal).

DoD:
- Użytkownik może się zalogować i uzyskuje sesję w przeglądarce.
- SSR działa z rozpoznaniem sesji.

---

## Faza 2 — Model danych i API (AppSync GraphQL + DynamoDB)

Cele:
- Model domeny gry i pokoi/lobby.
- Schemat GraphQL z subskrypcjami.

Model domeny (wysokopoziomowo):
- Game: id, code, status (lobby/playing/finished), seats[4], turnSeat, phase, assignedColors, tableCards[], budaOwnerSeat?, winnerOrder[], createdAt/updatedAt, version.
- PlayerRef (w Game.seats): userId, displayName, seat, color?, connected, lastSeen.
- Hand: przechowywana w encji Game (mapa seat → karty) lub w osobnej encji GameHand (decyzja performance/rozmiar obiektu).
- Card: { suit: ('C'|'D'|'H'|'S'), rank: (9|10|J|Q|K|A) }.
- GameEvent (opcjonalne audyt/log): id, gameId, type, payload, ts.

Instrukcje:
- Zdefiniuj schema GraphQL (Queries/Mutations/Subscriptions) dla: createGame, joinGame, startGame, playCard, takeBuda, resign, heartbeat (presence), getGame, listPublicGames; subskrypcje: onGameUpdated, onPlayerJoined, onChatMessage.
- Zaprojektuj DynamoDB (single-table design):
  - PK/SK: G#<gameId>, G#<gameId>#HANDS, G#<gameId>#EVENT#<ts> itd., lub prostsza 1 tabela Game + opcjonalna Eventy (v1 można zacząć od jednej tabeli dla Game).
- Autoryzacja resolwerów: właściciel gry i członkowie pokoju; odczyt gry ograniczony do uczestników lub gier publicznych (listings).
- Włącz wersjonowanie optymistyczne (etag/version) na Game, by unikać konfliktów.

DoD:
- Amplify codegen generuje typy TS po stronie frontu.
- Można stworzyć oraz dołączyć do gry poprzez GraphQL.
- Subskrypcja onGameUpdated działa i komunikuje zmiany w lobby.

---

## Faza 3 — Silnik gry (Lambda resolvers, serwer-autorytatywnie)

Cele:
- Implementacja zasad z specyfikacja/zasady_gry.md po stronie backendu.
- Deterministyczne rozdanie i walidacja ruchów.

Zakres:
- Funkcja Lambda „gameEngine” wołana przez mutacje: startGame, playCard, takeBuda.
- Mechanika:
  - Rozdanie (24 karty, 6 na gracza), losowy start lub 9♦ w pierwszej turze.
  - Walidacja zagrań: przebijanie, wymuszenie drugiej karty po przebiciu.
  - Dama Trefl: przypisanie kolorów i wyjątki.
  - Buda: zebranie stołu, blok ruchu w tej kolejce.
  - Koniec tury: kto został z kartami odrzuca najniższą kartę swojego koloru.
  - Kolejne tury: start po lewej od przegranego.
  - Koniec gry: gdy ktoś musi odrzucić Asa.
- Aktualizacje stanu gry w DynamoDB i publikacja przez AppSync.
- Odporność na konflikt równoległych mutacji (warunki wersji/wzorce idempotencji).

Testy:
- Jednostkowe (silnik, talia, walidacje).
- Integracyjne (wywołanie Lambdy z fixture’ami) w środowisku dev.

DoD:
- Sekwencja ruchów zgodna z zasadami, w tym edge-case’y z Damą Trefl.
- Baza zawiera poprawny stan po każdym ruchu.

---

## Faza 4 — Realtime, obecność i stabilność sesji

Cele:
- Płynne aktualizacje stołu i lobby.
- Obecność graczy i obsługa rozłączeń.

Instrukcje:
- Subskrypcje AppSync w kliencie (onGameUpdated, onPlayerJoined, onChatMessage).
- Heartbeat/lastSeen przez mutation heartbeat co N sekund; TTL lub EventBridge do sprzątania nieaktywnych.
- Rekonekt klienta do subskrypcji (exponential backoff).
- Ochrona przed podwójnymi ruchami przez blokadę tury i idempotency key w mutacjach.

DoD:
- Widoczna obecność/nieobecność graczy.
- Po odświeżeniu strony sesja i subskrypcje się odnawiają.

---

## Faza 5 — Frontend: fundamenty UI (Next.js + Amplify)

Cele:
- Szkielet aplikacji zgodny z projekt_aplikacji.md.
- Integracja auth, routing, stan globalny.

Instrukcje:
- Strony:
  - / — ekran główny: „Nowa gra”, „Dołącz do gry”, „Zasady”, „Ustawienia”.
  - /game/[code] — lobby gry (sloty graczy, zaproszenia, start).
  - /play/[gameId] — widok stołu, ręka, status, akcje, czat.
  - /rules — interaktywne zasady.
  - /settings — preferencje (język, motyw, dźwięki).
- Konfiguracja Amplify w Next.js (SSR/ISR zgodnie z hostingiem Amplify).
- Stan: React Query/Zustand/Redux (wybór), adapter do subskrypcji AppSync.
- Komponenty: Table, Hand, Card, StatusPanel, ActionButtons, Chat.
- Dostępność (klawiatura, ARIA), responsywność, theming.

DoD:
- Przepływ: utwórz pokój → dołącz → rozpocznij → przejdź do stołu.
- Render ręki gracza i możliwych ruchów (podświetlanie).

---

## Faza 6 — Frontend: logika rozgrywki i UX

Cele:
- Pełny interfejs gracza podczas gry.
- Minimalizacja błędów użytkownika (potwierdzanie ruchów).

Instrukcje:
- Integracja mutacji: startGame, playCard, takeBuda.
- Reguły UI:
  - Niedostępne karty przyciemnione wg stanu z backendu (backend autorytatywny; klient może mieć lekką weryfikację).
  - Wymuszenie drugiej karty po przebiciu (flow w UI).
  - „Weź Budę” aktywne tylko gdy wymagane.
- Animacje: ruch kart, zbieranie Buda, koniec gry (celebracja).
- Panel statusu: czyja kolej, przypisane kolory, etap, licznik rąk.

DoD:
- Pełna partia możliwa do rozegrania w 4 osoby.
- Brak nielegalnych zagrań zaakceptowanych przez backend.

---

## Faza 7 — Czat i reakcje

Cele:
- Prosty czat tekstowy i szybkie emotki.

Instrukcje:
- Mutacja sendChatMessage + subskrypcja onChatMessage z filtrem gameId.
- Moderacja minimalna (limit długości, throttling, filtrowanie podstawowe).
- UI: szybkie reakcje (😂 😡 👏 🐶) + krótkie wiadomości.

DoD:
- Wiadomości i reakcje aktualizują się w czasie rzeczywistym.

---

## Faza 8 — Tryb solo/AI i samouczek (opcjonalne w wersji 1)

Cele:
- Boty o prostych heurystykach.
- Mini-partia samouczka.

Instrukcje:
- Lambda „botEngine” nasłuchująca zmian stanu gry w EventBridge/DynamoDB Streams i wykonująca ruchy, gdy tura bota.
- Samouczek: skryptowany scenariusz, strzałki i komunikaty w UI.

DoD:
- Gra z 1–3 botami możliwa.
- Samouczek przeprowadza przez kluczowe zasady.

---

## Faza 9 — Niefunkcjonalne: bezpieczeństwo, wydajność, koszty

Bezpieczeństwo:
- Cognito + AppSync auth rules: dostęp tylko dla członków gry; listing gier publicznych ograniczony.
- Walidacja wejścia w Lambda; rate limiting na mutacje (WAF/Shield opcjonalnie).
- Szyfrowanie domyślne (DynamoDB, S3), tajemnice w SSM.

Wydajność:
- Rozmiar obiektu Game kontrolowany (opcjonalny podział na Game + GameHands).
- Indeksy dla zapytań (GSI do listowania gier).
- Minimalizacja „hot partition” (rozłożenie trafficu, ograniczenie eventów czatu).

Koszty:
- Bezserwerowe zasoby (AppSync/Lambda/DynamoDB on-demand).
- Limity TTL dla zdarzeń/czatu.

DoD:
- Audyt uprawnień przechodzi.
- Testy obciążeniowe podstawowe.

---

## Faza 10 — Testy i jakość

Testy:
- Jednostkowe (silnik, pomocnicze).
- Integracyjne (Lambda + AppSync).
- E2E (Playwright) dla kluczowych user flows.
- Snapshoty UI dla stabilności.

Jakość:
- Coverage minimalny dla krytycznych modułów (silnik).
- Lint/format na CI.
- Previews środowisk w Amplify dla PR.

DoD:
- Zielone pipeline’y na gałęziach dev/staging.
- Raporty testów dostępne w CI.

---

## Faza 11 — Wdrożenie i migracje środowisk

Instrukcje:
- Amplify environments: dev → staging → prod (promocja zmian).
- „amplify pull/push” zgodnie z konwencją zespołu.
- Zmiany schematu: wersjonowanie, migracja danych (skrypty, feature flags).
- Monitoring: CloudWatch (logi Lambda), AppSync metrics, Sentry dla frontu.

DoD:
- Stabilne wdrożenie prod z monitorowaniem i alertami.

---

## Interfejsy i kontrakty API (zarys)

Mutacje:
- createGame(name?, visibility) → Game
- joinGame(code) → Game
- startGame(gameId) → Game
- playCard(gameId, card, secondCard?) → Game
- takeBuda(gameId) → Game
- heartbeat(gameId) → PresenceAck
- sendChatMessage(gameId, text|emoji) → ChatMessage

Zapytania:
- getGame(id|code) → Game
- listPublicGames() → [GameSummary]

Subskrypcje:
- onGameUpdated(gameId) → Game
- onPlayerJoined(gameId) → PlayerRef
- onChatMessage(gameId) → ChatMessage

Autoryzacja (przykład):
- Do gry: członkowie seats[seat].userId.
- Tworzenie gry: zalogowani.
- Gry publiczne: tylko listing summary bez wrażliwych danych (bez rąk).

---

## Mapowanie funkcjonalności na UI

- Ekran główny: akcje „Nowa gra”, „Dołącz do gry”, „Zasady”, „Ustawienia”.
- Lobby: nicki/avatary, zaproszenia, czat, start przez hosta.
- Stół: ostatnie karty, licznik kart graczy, ikona „Budy”.
- Ręka gracza: wachlarz, podpowiedzi legalnych ruchów, potwierdzenie ruchu.
- Panel statusu: tura, przypisane kolory, etap.
- Akcje: „Weź Budę”, „Potwierdź ruch”.

---

## Harmonogram (przykładowy)

- Tydz. 1: Faza 0–1 (bootstrap, Auth).
- Tydz. 2: Faza 2 (API + model) + subskrypcje ✅
- Tydz. 3–4: Faza 3 (silnik gry + testy) ✅
- Tydz. 5: Faza 5 (UI fundamenty) + integracja lobby.
- Tydz. 6: Faza 6 (interfejs gry + UX).
- Tydz. 7: Faza 4 (presence), Faza 7 (czat).
- Tydz. 8: Faza 9–10 (niefunkcjonalne, testy, wydajność), wdrożenie prod.
- Opcj. Tydz. 9–10: Faza 8 (AI/samouczek).

---

## Ryzyka i mitigacje

- Konflikty stanu gry: optymistyczne blokady wersji i idempotencja.
- Realtime opóźnienia: lekkie payloady, debounce UI, odświeżanie stanu on reconnect.
- Złożoność reguł: pokrycie testami edge-case’ów (Dama Trefl, Buda, odrzucanie Asa).
- Koszty: monitoring użycia subskrypcji i dynamo, limity czatu.

---

## Definicja Done (globalna)

- Funkcje kluczowe działają w dev, przetestowane w staging.
- Backlog krytycznych bugów = 0.
- Observability: dashboardy i alerty skonfigurowane.
- Dokumentacja użytkowa i techniczna uzupełniona.
