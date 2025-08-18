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
