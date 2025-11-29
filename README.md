# AddiPi-Auth-Service

## English

### Overview

AddiPi-Auth-Service is a small authentication microservice implemented in Node.js + TypeScript. It provides user registration, login, token-based authentication (access + refresh tokens), token refresh and verification endpoints. The service is designed to be used as an auth backend for frontends and other services.

Key components:
- Express server
- JWT-based access and refresh tokens
- Azure Cosmos DB for user storage (via `@azure/cosmos`)
- TypeScript for type-safety

### Features
- Register users (university email restriction `@uwr.edu.pl` in current implementation)
- Login with JWT access and refresh tokens
- Refresh access tokens using refresh tokens
- Verify access token
- Secure password hashing with `bcryptjs`

### Requirements
- Node.js 18+ (tested with Node 20 images in Dockerfile)
- npm
- Azure Cosmos DB (or mock) for persistence

### Environment variables
The service expects configuration via environment variables. Typical variables used in the repo:

- `PORT` - HTTP port (default provided by `src/config/config`)
- `COSMOS_ENDPOINT` - Azure Cosmos DB endpoint
- `COSMOS_KEY` - Azure Cosmos DB primary key
- `JWT_SECRET` - Secret for signing access tokens
- `JWT_REFRESH_SECRET` - Secret for signing refresh tokens

Make sure these are set in your environment or in a `.env` mechanism used by your deployment.

### Quick start (local)
1. Install dependencies:

```powershell
npm ci
```

2. Build the project:

```powershell
npm run build
```

3. Run the compiled app:

```powershell
node ./dist/index.js
```

Or use `npm start` which runs `npx tsc && node ./dist/index.js` by default.

### Docker
A `Dockerfile` is included for multi-stage builds. Example build & run:

```powershell
docker build -t addipi-auth-service:latest .
docker run --rm -p 3000:3000 --name addipi-auth addipi-auth-service:latest
```

If you use cookies for refresh tokens, configure CORS with `credentials: true` and set cookie options accordingly.

### API (basic)
- `GET /health` — health check; returns `{ ok: true }`.
- `POST /auth/register` — register new user. Body JSON:

```json
{
	"email": "testuser@uwr.edu.pl",
	"password": "Passw0rd123!",
	"firstName": "Jan",
	"lastName": "Kowalski"
}
```

Response: `201` with `{ user, accessToken, refreshToken }` (current implementation returns both tokens in JSON).

- `POST /auth/login` — login. Body JSON: `{ "email": "...", "password": "..." }`.
- `POST /auth/refresh` — refresh access token. Body JSON: `{ "refreshToken": "..." }` (or if using HttpOnly cookie, call with credentials included and no body).
- `GET /auth/verify` — verify access token via `Authorization: Bearer <ACCESS_TOKEN>` header. Returns `{ valid: true, user }` or `401`.

### Security notes
- Prefer storing refresh tokens in HttpOnly cookies with `Secure` and appropriate `SameSite` attributes. Access tokens are best stored in memory and sent in `Authorization` headers.
- Do not store tokens in plain localStorage if you can avoid it (XSS risk).
- Use strong secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET` and rotate when necessary.

### Troubleshooting
- If `req.body` is `undefined` when posting JSON, ensure that the request includes `Content-Type: application/json` and that `express.json()` middleware is active. Use `curl` or Postman to test.
- If endpoints hang, check middleware order (body parser must run before routes) and ensure `cors()` is used correctly (`app.use(cors())`).

### Development notes
- Code lives in `src/`. Build output is `dist/`.
- Modify TypeScript files and run `npm run build`.
- Consider improving error handling and avoiding `process.exit()` in library modules — prefer throwing errors for testability.

---

## Polski

### Przegląd

AddiPi-Auth-Service to mikroserwis autoryzacji napisany w Node.js + TypeScript. Udostępnia rejestrację użytkowników, logowanie, obsługę tokenów (access + refresh), odświeżanie tokenów i weryfikację. Może być używany jako backend uwierzytelniania dla aplikacji frontendowych i innych usług.

Główne elementy:
- Serwer Express
- JWT (access i refresh)
- Azure Cosmos DB do przechowywania użytkowników (`@azure/cosmos`)
- TypeScript dla bezpieczeństwa typów

### Funkcjonalności
- Rejestracja użytkowników (aktualnie ograniczona do adresów `@uwr.edu.pl`)
- Logowanie z JWT
- Odświeżanie tokenów
- Weryfikacja access tokena
- Haszowanie haseł `bcryptjs`

### Wymagania
- Node.js 18+ (Dockerfile używa Node 20)
- npm
- Azure Cosmos DB (lub mock) do przechowywania danych

### Zmienne środowiskowe
Ustaw zmienne środowiskowe używane przez aplikację:

- `PORT` - port HTTP
- `COSMOS_ENDPOINT` - endpoint Azure Cosmos DB
- `COSMOS_KEY` - klucz do Azure Cosmos DB
- `JWT_SECRET` - sekret do podpisywania access tokenów
- `JWT_REFRESH_SECRET` - sekret do podpisywania refresh tokenów

### Szybkie uruchomienie lokalne
1. Zainstaluj zależności:

```powershell
npm ci
```

2. Zbuduj projekt:

```powershell
npm run build
```

3. Uruchom aplikację:

```powershell
node ./dist/index.js
```

Lub użyj `npm start` (uruchamia `npx tsc && node ./dist/index.js`).

### Docker
W repo jest `Dockerfile`. Przykładowe polecenia:

```powershell
docker build -t addipi-auth-service:latest .
docker run --rm -p 3000:3000 --name addipi-auth addipi-auth-service:latest
```

Jeżeli używasz cookie do refresh tokenów, skonfiguruj CORS z `credentials: true` i ustaw cookie odpowiednio.

### API (podstawowe)
- `GET /health` — health check; zwraca `{ ok: true }`.
- `POST /auth/register` — rejestracja. Body JSON:

```json
{
	"email": "testuser@uwr.edu.pl",
	"password": "Passw0rd123!",
	"firstName": "Jan",
	"lastName": "Kowalski"
}
```

Odpowiedź: `201` z `{ user, accessToken, refreshToken }` (aktualna implementacja zwraca oba tokeny w body).

- `POST /auth/login` — logowanie. Body JSON: `{ "email": "...", "password": "..." }`.
- `POST /auth/refresh` — odświeżenie tokena. Body JSON: `{ "refreshToken": "..." }` (lub jeśli używasz HttpOnly cookie, wykonaj request z `credentials` i bez body).
- `GET /auth/verify` — weryfikacja access tokena, użyj nagłówka `Authorization: Bearer <ACCESS_TOKEN>`. Zwraca `{ valid: true, user }` lub `401`.

### Bezpieczeństwo
- Zalecane: przechowywać refresh token w cookie z flagą `HttpOnly`, `Secure` i odpowiednim `SameSite`. Access token najlepiej w pamięci aplikacji.
- Unikaj przechowywania refresh tokenów w `localStorage` (ryzyko XSS).
- Używaj silnych sekretów dla `JWT_SECRET` i `JWT_REFRESH_SECRET`.

### Rozwiązywanie problemów
- Jeżeli `req.body` jest `undefined`, upewnij się, że wysyłasz `Content-Type: application/json` i że `express.json()` działa (middleware powinien być zarejestrowany przed trasami).
- Jeżeli endpointy się zawieszają, sprawdź kolejność middleware (body parser powinien być przed routerem) i poprawne użycie `cors()` (`app.use(cors())`).

### Dla developerów
- Źródła w `src/`, wyjście `dist/`.
- Po zmianach TypeScript uruchom `npm run build`.
- Rozważ refactor: zamiast `process.exit()` rzucać błędy, ułatwi to testowanie.

---

If you want, I can also:
- add an example Postman collection export,
- implement HttpOnly refresh-token cookie handling (server-side), or
- add a short CONTRIBUTING.md and run/test scripts.

If you'd like any of those, tell me which and I'll add them.
