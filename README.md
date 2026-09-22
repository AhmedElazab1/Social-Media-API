# NestJS API Boilerplate

A production-oriented, security-conscious NestJS backend starter. Clone it, configure your environment, extend the schema, and start building your application without rebuilding the same authentication, validation, and error-handling plumbing from scratch.

This boilerplate is aimed at developers who want a **solid, realistic foundation** — not a minimal "hello world" starter — and who care about how refresh tokens, sessions, and authorization actually work in practice.

**Philosophy:**
- **Reusable** — all cross-cutting concerns (pagination, filtering, sorting, searching, error handling, response shaping) live in `src/common` and are ready to be dropped into any new module.
- **Production-oriented** — security defaults (hashed tokens, HTTP-only cookies, environment validation, Serializable transactions) are on from day one.
- **Security-conscious** — refresh tokens are never stored in plain text; replay attacks are detected and responded to by revoking all active sessions.
- **Modular** — feature modules are self-contained and import only what they need.
- **Easy to extend** — add a new module, inject the common services, and follow the established pattern.

---

## ✨ Features

| Area | What is included |
|---|---|
| **Framework** | NestJS 11, TypeScript 5, ESM modules |
| **Database** | Prisma 7 ORM with PostgreSQL via `@prisma/adapter-pg` driver adapter |
| **Auth** | JWT access tokens + secure refresh token sessions |
| **Refresh tokens** | SHA-256 hashed storage, rotation on every use, replay detection |
| **Sessions** | Database-backed session table; per-device logout and logout-all |
| **Authorization** | Role-based (`USER` / `ADMIN`) via `@Roles()` decorator + `RolesGuard` |
| **Validation** | `class-validator` + global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform) |
| **Env validation** | Zod schema validated at startup — the app refuses to start with a bad config |
| **API docs** | Swagger / OpenAPI at `/docs` with Bearer auth and cookie auth support |
| **Response shape** | Global `ResponseInterceptor` wraps every successful response in `{ success, data }` or `{ success, data, meta }` |
| **Error handling** | Global `AllExceptionsFilter` handles HTTP exceptions, Prisma known errors, and unexpected errors uniformly |
| **Pagination** | Reusable `PaginationService` with configurable page/limit (default 1/20, max limit 100) |
| **Filtering** | Reusable `FilteringService` with allowlist-validated `field:value` syntax |
| **Searching** | Reusable `SearchingService` for case-insensitive text search |
| **Sorting** | Reusable `SortingService` with allowlist-validated field and `asc`/`desc` order |
| **Soft delete** | Users are soft-deleted via `deletedAt` timestamp; `findOne` and `findAll` only return non-deleted records |
| **Password hashing** | bcrypt with cost factor 12 |
| **Scheduled cleanup** | Expired and old revoked sessions are purged from the database every night at midnight |
| **Docker** | `docker-compose.yml` for a local PostgreSQL 16 development database |
| **Build tooling** | SWC compiler for fast builds |
| **Code quality** | ESLint + Prettier |

---

## ⭐ What Makes This Boilerplate Special

### Hashed Refresh Tokens
Raw refresh tokens are never persisted. Only a SHA-256 hash of each token is stored in the `Session` table. If the database is compromised, the attacker cannot use the hashes to log in.

### Refresh Token Rotation with Replay Detection
Every time a refresh token is used, it is atomically revoked and a new one is issued inside a **`Serializable` database transaction**. The old session records which new session replaced it (`replacedById` field).

If a previously-rotated (already-replaced) token is presented again, the system recognises this as a **replay attack** — someone is reusing a stolen token — and immediately revokes *all* active sessions for that user across every device.

### Serializable Transactions with Retry Logic
The token rotation transaction runs at `Serializable` isolation level to prevent race conditions under concurrent refresh requests. Prisma transaction conflict errors (`P2034`) are caught and retried up to three times with a small linear back-off before the operation fails.

### Session-Based Multi-Device Management
Each login creates an independent `Session` record. Users can log out of the current device (revoking only that session) or log out of all devices at once (revoking all active sessions). The `POST /auth/logout-all` endpoint requires a valid access token so only the authenticated user can revoke their own sessions.

### HTTP-Only Refresh Token Cookie
The refresh token is delivered exclusively via an HTTP-only cookie scoped to the `/auth` path. It is inaccessible to JavaScript, which eliminates XSS-based token theft. In production (`NODE_ENV=production`) the cookie is also flagged `Secure`.

### Environment Validation at Startup
A Zod schema in `src/config/env.ts` is run by `ConfigModule` before the application finishes bootstrapping. A missing or malformed environment variable causes the process to exit immediately with a clear error, rather than failing at runtime in an obscure way.

### Centralised Exception Handling
A single global filter (`AllExceptionsFilter`) intercepts every unhandled exception — NestJS `HttpException`, Prisma `PrismaClientKnownRequestError` (unique constraint `P2002`, record not found `P2025`), and anything else — and returns a consistent JSON error envelope. Application code never needs to manually format error responses.

### Consistent API Response Envelope
The global `ResponseInterceptor` ensures every successful response from every controller follows the same shape. Standard responses are wrapped in `{ success: true, data }`, and paginated responses in `{ success: true, data, meta }`. Consumers can rely on this shape unconditionally.

### Reusable Query Utilities
`PaginationService`, `FilteringService`, `SortingService`, and `SearchingService` are injectable utilities registered in `CommonModule`. New feature modules inject them directly and pass allowlists of sortable/filterable fields — the services enforce the allowlist and throw `BadRequestException` for invalid inputs.

### Mapper-Based Response DTOs
Prisma model types and API response types are kept separate. The `users.mapper.ts` function explicitly maps a `User` model to a `UserResponseDto`, stripping internal fields like `passwordHash` and `deletedAt` before data ever leaves the service layer.

### Soft Delete
Deleting a user sets `deletedAt` rather than removing the row. All read queries filter `deletedAt: null`. This preserves referential integrity and audit trails without requiring cascading deletes.

### Scheduled Session Cleanup
A cron job fires every day at midnight (`@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)`) and deletes sessions that have expired **and** revoked sessions older than 30 days. This keeps the `Session` table from growing indefinitely without losing recent audit history.

---

## 🏗️ Architecture

```
.
├── prisma/
│   └── schema.prisma          # Database schema — models, enums, relations
├── prisma.config.ts           # Prisma CLI configuration (schema path, migrations path, datasource)
├── docker-compose.yml         # Local PostgreSQL 16 container
├── src/
│   ├── main.ts                # Bootstrap: Swagger, ValidationPipe, cookie-parser, filters, interceptors
│   ├── app.module.ts          # Root module: ConfigModule, ScheduleModule, PrismaModule, feature modules
│   │
│   ├── config/
│   │   └── env.ts             # Zod environment schema — validated at startup
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts   # Global PrismaModule
│   │   └── prisma.service.ts  # PrismaClient wrapper with pg driver adapter; connects/disconnects with the module lifecycle
│   │
│   ├── common/                # Reusable, application-agnostic infrastructure
│   │   ├── common.module.ts   # Exports all common services
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts   # @CurrentUser() — extracts req.user
│   │   │   └── roles.decorator.ts          # @Roles(...) — sets role metadata
│   │   ├── dto/
│   │   │   ├── list-query.dto.ts           # Composed query DTO (pagination + sorting + filtering + search)
│   │   │   ├── pagination.dto.ts           # page, limit
│   │   │   ├── sorting.dto.ts              # sortBy, sortOrder
│   │   │   ├── filtering.dto.ts            # filter (field:value)
│   │   │   ├── search.dto.ts               # search
│   │   │   ├── paginated-response.dto.ts   # { data, meta } shape
│   │   │   └── pagination-meta.dto.ts      # { page, limit, total, totalPages }
│   │   ├── filter/
│   │   │   └── all-exceptions.filter.ts    # Global exception filter
│   │   ├── guards/
│   │   │   └── roles.guard.ts              # Role-based authorization guard
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts     # Global response envelope
│   │   └── services/
│   │       ├── pagination.service.ts
│   │       ├── filtering.service.ts
│   │       ├── sorting.service.ts
│   │       └── searching.service.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts          # register, login, refresh, logout, logout-all
│   │   │   ├── auth.service.ts             # Orchestrates registration, login, refresh, logout
│   │   │   ├── dto/                        # RegisterDto, LoginDto, LoginResponseDto
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts       # Passport JWT guard
│   │   │   ├── jobs/
│   │   │   │   └── session-cleanup.job.ts  # Nightly cron job
│   │   │   ├── services/
│   │   │   │   ├── token.service.ts        # JWT signing, bcrypt, secure token generation, SHA-256 hashing
│   │   │   │   ├── refresh-token.service.ts# Token creation, rotation, revocation, replay detection
│   │   │   │   └── session.service.ts      # Session cleanup logic
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts         # Passport JWT strategy (Bearer token from Authorization header)
│   │   │   └── types/                      # Internal auth/refresh-token result types
│   │   │
│   │   └── users/
│   │       ├── users.module.ts
│   │       ├── users.controller.ts         # CRUD + /me endpoint; ADMIN-only except /me
│   │       ├── users.service.ts            # Business logic, soft delete, list with query utilities
│   │       ├── users.mapper.ts             # Prisma User → UserResponseDto (strips sensitive fields)
│   │       └── dto/
│   │           ├── create-user.dto.ts
│   │           ├── update-user.dto.ts
│   │           └── user-response.dto.ts    # Public-facing user shape
│   │
│   ├── generated/
│   │   └── prisma/                         # Auto-generated Prisma Client — do not edit manually
│   │
│   └── types/
│       └── express.d.ts                    # Augments Express.User with { userId, email, role }
└── test/
    └── app.e2e-spec.ts                     # Scaffold e2e test file
```

The modules interact as follows: `AppModule` imports `ConfigModule` (global), `ScheduleModule`, `PrismaModule` (global), `UsersModule`, and `AuthModule`. `AuthModule` imports `UsersModule` and `PrismaModule`. `UsersModule` imports `CommonModule` so its services can be injected into `UsersService`. All guards and filters are applied globally in `main.ts` or at the controller level where finer-grained control is needed.

---

## 🔐 Authentication & Authorization

### Overview

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant TokenService
    participant RefreshTokenService
    participant DB

    Client->>AuthController: POST /auth/register { email, username, password, ... }
    AuthController->>AuthService: register(dto)
    AuthService->>TokenService: hashPassword(password)  [bcrypt, cost 12]
    AuthService->>DB: user.create({ ..., passwordHash })
    AuthController-->>Client: 201 UserResponseDto

    Client->>AuthController: POST /auth/login { email, password }
    AuthController->>AuthService: login(dto)
    AuthService->>DB: user.findUnique({ email })
    AuthService->>TokenService: comparePassword(password, hash)
    AuthService->>TokenService: generateAccessToken(userId, email, role)  [JWT, exp: JWT_EXP]
    AuthService->>RefreshTokenService: create(userId)
    RefreshTokenService->>TokenService: generateSecureToken()  [32 random bytes, hex]
    RefreshTokenService->>TokenService: hashToken(token)  [SHA-256]
    RefreshTokenService->>DB: session.create({ userId, refreshTokenHash, expiresAt })
    AuthController-->>Client: 200 { accessToken, user } + Set-Cookie: refreshToken (HttpOnly)

    Client->>AuthController: POST /auth/refresh  [Cookie: refreshToken]
    AuthController->>AuthService: refresh(rawToken)
    AuthService->>RefreshTokenService: rotateToken(rawToken)
    RefreshTokenService->>TokenService: hashToken(rawToken)
    RefreshTokenService->>DB: session.findFirst({ refreshTokenHash })
    alt Token already rotated (revokedAt + replacedById set)
        RefreshTokenService->>DB: session.updateMany revokeAll(userId)  replay detected
        RefreshTokenService-->>Client: 401 Unauthorized
    else Token valid
        RefreshTokenService->>DB: [Serializable tx] revoke old session, create new session, link replacedById
        AuthController-->>Client: 200 { accessToken, user } + new refreshToken cookie
    end

    Client->>AuthController: POST /auth/logout  [Cookie: refreshToken]
    AuthController->>AuthService: logout(rawToken)
    RefreshTokenService->>DB: session.update({ revokedAt: now })
    AuthController-->>Client: 200 { message } + cleared cookie

    Client->>AuthController: POST /auth/logout-all  [Authorization: Bearer accessToken]
    AuthController->>AuthService: logoutAll(userId)
    RefreshTokenService->>DB: session.updateMany({ revokedAt: now }) for all active sessions
    AuthController-->>Client: 200 { message }
```

### Authorization

Protected routes apply `JwtAuthGuard` (validates the Bearer token in the `Authorization` header via Passport JWT strategy). Role-based access is enforced by combining `JwtAuthGuard` with `RolesGuard` and the `@Roles()` decorator.

```typescript
// Controller-level: only ADMINs can access this controller
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController { ... }

// Override for a single route — allow USER role too
@Roles(Role.USER)
@Get('me')
getMe(@CurrentUser() user: Express.User) { ... }
```

The `@CurrentUser()` decorator extracts `req.user` (populated by the JWT strategy after token validation) and injects it directly into the handler parameter.

**Roles defined in the schema:**

| Role | Description |
|---|---|
| `USER` | Default role assigned at registration |
| `ADMIN` | Elevated privileges; can access the full Users API |

---

## 🗄️ Database

### Setup

The project uses **PostgreSQL 16** via **Prisma 7** with the `@prisma/adapter-pg` driver adapter (native `pg` client, no Rust engine binary required for query execution).

### Schema

The current schema is intentionally minimal — it provides only the infrastructure required for authentication. Application-specific models should be added on top of it.

```prisma
enum Role {
  USER
  ADMIN
}

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  username       String    @unique
  passwordHash   String
  firstName      String
  lastName       String
  bio            String?
  profilePicture String?
  role           Role      @default(USER)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?           // Soft delete
  sessions       Session[]
}

model Session {
  id               String    @id @default(uuid())
  refreshTokenHash String              // SHA-256 hash — raw token is never stored
  userId           String
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt        DateTime  @default(now())
  expiresAt        DateTime
  revokedAt        DateTime?           // Set on logout or replay detection
  replacedById     String?   @unique  // Links this session to the next one (rotation chain)
  replacedBy       Session?  @relation("SessionReplacement", fields: [replacedById], references: [id])
  replacedFrom     Session?  @relation("SessionReplacement")

  @@index([userId])
}
```

**Key design notes:**
- `Session.refreshTokenHash` stores only the SHA-256 digest of the raw refresh token.
- `Session.replacedById` creates a linked-list chain between rotated sessions, enabling replay detection.
- `Session.revokedAt` and `Session.expiresAt` are checked independently — a session can be revoked before it expires.
- `User.deletedAt` enables soft deletion while preserving session and audit records.
- `@@index([userId])` on `Session` speeds up per-user session lookups (rotation, revokeAll, cleanup).

---

## ⚙️ Installation

### Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 20+ | Check with `node -v` |
| npm | Bundled with Node.js |
| Docker & Docker Compose | For the local PostgreSQL instance |

### Clone

```bash
git clone https://github.com/your-username/nest-api-boilerplate.git
cd nest-api-boilerplate
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

`.env.example` contents with descriptions:

```dotenv
NODE_ENV="development"             # development | production | test

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/your_database"
PORT="3000"                        # HTTP port the application listens on

JWT_SECRET="your-jwt-secret"       # Secret for signing access tokens — use a long random string
JWT_EXP="15m"                      # Access token lifetime (ms-compatible: 15m, 1h, etc.)

JWT_REFRESH_SECRET="your-refresh-secret"  # Separate secret for refresh tokens
JWT_REFRESH_EXP="7d"               # Refresh token lifetime
```

> **Important:** `JWT_REFRESH_SECRET` is required and must differ from `JWT_SECRET`. The application will refuse to start if any required variable is missing or empty.

### Database

Start PostgreSQL using Docker Compose:

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container on port `5432` with:
- User: `postgres`
- Password: `postgres`
- Database: `nest_api`
- Data persisted in a named Docker volume (`postgres_data`)

Update `DATABASE_URL` in your `.env` to match (e.g. `postgresql://postgres:postgres@localhost:5432/nest_api`).

Generate the Prisma Client:

```bash
npx prisma generate
```

Run migrations to create the database schema:

```bash
npx prisma migrate dev --name init
```

### Run the Application

| Command | Description |
|---|---|
| `npm run start:dev` | Development mode with hot-reload (watch) |
| `npm run start` | Start with SWC compiler (no watch) |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled output (`node dist/main`) |
| `npm run start:debug` | Development mode with Node.js debugger |

---

## 📚 API Documentation

Swagger UI is available at:

```
http://localhost:3000/docs
```

The Swagger configuration registers two authentication schemes:

| Scheme | Usage |
|---|---|
| **BearerAuth** | Paste an access token into the `Authorization: Bearer <token>` field. Used by protected endpoints like `GET /users` and `POST /auth/logout-all`. |
| **CookieAuth (`refreshToken`)** | Documents the `refreshToken` HTTP-only cookie used by `POST /auth/refresh` and `POST /auth/logout`. Browsers handle this automatically; in Swagger UI you may need to set the cookie manually via the browser DevTools. |

All controllers, routes, request/response types, and expected status codes are documented with `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty`, and `@ApiParam` decorators.

---

## 🔄 API Response Format

Every successful response is wrapped by the global `ResponseInterceptor`.

### Standard Response

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "username": "john_doe",
    "role": "USER"
  }
}
```

### Paginated Response

Returned when the service returns `{ data, meta }` (i.e., the output of `PaginationService.paginate()`):

```json
{
  "success": true,
  "data": [
    { "id": "...", "email": "...", "username": "..." }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

## ❌ Error Handling

The global `AllExceptionsFilter` catches every unhandled exception and maps it to a consistent JSON shape:

```json
{
  "statusCode": 409,
  "message": "A record with the provided unique value already exists",
  "path": "/auth/register",
  "timestamp": "2024-06-01T10:30:00.000Z"
}
```

| Exception type | Behaviour |
|---|---|
| `HttpException` (NestJS) | Status and message extracted directly; validation error arrays are joined into a single string |
| `PrismaClientKnownRequestError` `P2002` | Unique constraint violation → `409 Conflict` |
| `PrismaClientKnownRequestError` `P2025` | Record not found → `404 Not Found` |
| Other Prisma errors | Logged with `Logger.error`; client receives `500 Internal Server Error` |
| Unexpected errors | Logged with full stack trace; client receives `500 Internal Server Error` |

Internal error details are never leaked to the client.

---

## 📄 Validation

The global `ValidationPipe` is configured in `main.ts` with the following options:

```typescript
new ValidationPipe({
  whitelist: true,            // Strip any properties not declared in the DTO
  forbidNonWhitelisted: true, // Throw 400 if unknown properties are present
  transform: true,            // Automatically transform query string types
})
```

- **`whitelist: true`** prevents extra fields from reaching service code.
- **`forbidNonWhitelisted: true`** makes the API strict — clients cannot silently send unrecognised fields.
- **`transform: true`** is important for query parameters: `?page=2&limit=10` strings are automatically coerced to `number` via `@Type(() => Number)` on the `PaginationDto`.

---

## 📊 Pagination, Filtering, Searching & Sorting

All four utilities are registered in `CommonModule` as injectable services.

### Query Parameters

Use `ListQueryDto` (or compose the individual DTOs) on any list endpoint:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number (min: 1) |
| `limit` | `number` | `20` | Items per page (min: 1, max: 100) |
| `sortBy` | `string` | service default | Field to sort by (validated against an allowlist) |
| `sortOrder` | `asc` or `desc` | `desc` | Sort direction |
| `filter` | `string` | — | `field:value` (field validated against an allowlist) |
| `search` | `string` | — | Free-text search term (max 100 chars) |

### Example Request

```
GET /users?page=2&limit=10&sortBy=createdAt&sortOrder=asc&filter=role:ADMIN&search=john
```

### Using the Services in a New Module

```typescript
constructor(
  private readonly paginationService: PaginationService,
  private readonly sortingService: SortingService,
  private readonly filteringService: FilteringService,
  private readonly searchingService: SearchingService,
) {}

async findAll(query: ListQueryDto) {
  const sort = this.sortingService.getSortOptions(
    query.sortBy, query.sortOrder,
    ['name', 'createdAt'] as const,  // allowlist
    'createdAt',                      // default
  );

  const filter = this.filteringService.getFilterOptions(
    query.filter,
    ['status', 'category'] as const,
  );

  return this.paginationService.paginate(
    query,
    (skip, take) => this.prisma.product.findMany({ skip, take, orderBy: { [sort.field]: sort.order } }),
    () => this.prisma.product.count(),
  );
}
```

---

## 🔒 Security Considerations

| Mechanism | Implementation |
|---|---|
| Password hashing | bcrypt, cost factor 12 |
| Refresh token storage | SHA-256 hash only — raw token is never written to the database |
| HTTP-only refresh token cookie | Scoped to `/auth` path, `sameSite: lax`, `httpOnly: true` |
| Secure cookie in production | `secure: true` when `NODE_ENV === 'production'` |
| Access token transport | Authorization header (Bearer) — not stored in cookies |
| Refresh token replay detection | Re-use of a rotated token triggers full session revocation for the user |
| Serializable transaction | Token rotation is atomic at the highest PostgreSQL isolation level |
| Retry on transaction conflict | Up to 3 retries with linear back-off for Prisma `P2034` errors |
| Role-based authorization | `RolesGuard` + `@Roles()` decorator enforced at controller/handler level |
| Input validation | `ValidationPipe` with `whitelist` and `forbidNonWhitelisted` |
| SQL injection prevention | All queries go through Prisma's parameterized query engine |
| Environment variable validation | Zod schema aborts startup on misconfiguration |
| Session expiration | `expiresAt` is checked during token rotation |
| Session cleanup | Nightly cron job removes expired sessions and revoked sessions older than 30 days |
| Sensitive field stripping | `users.mapper.ts` explicitly maps Prisma models to response DTOs, omitting `passwordHash` and `deletedAt` |

---

## 🧪 Testing

| Command | Description |
|---|---|
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:cov` | Run unit tests with coverage report |
| `npm run test:debug` | Run tests with Node.js inspector |
| `npm run test:e2e` | Run end-to-end tests |

An e2e scaffold file exists at `test/app.e2e-spec.ts`. Beyond this scaffold, no meaningful test coverage has been written yet. Adding tests for the authentication flow and common services is a recommended next step when using this boilerplate.

---

## 🧹 Code Quality

| Tool | Purpose |
|---|---|
| **TypeScript 5** | Strict static typing throughout |
| **ESLint 9** | Linting with `typescript-eslint` and `eslint-plugin-prettier` |
| **Prettier 3** | Opinionated code formatting |
| **SWC** | Fast TypeScript/JavaScript compiler used for development builds |

```bash
# Format all source files
npm run format

# Lint and auto-fix
npm run lint
```

The project is configured as an ES module (`"type": "module"` in `package.json`). All internal imports use the `.js` extension suffix, which is required for ESM compatibility with Node.js.

---

## 🐳 Docker

`docker-compose.yml` provides a ready-to-use local PostgreSQL instance:

```yaml
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nest_api
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

- Data is persisted in the `postgres_data` named volume across container restarts.
- Exposed on `localhost:5432`.
- Default credentials are for **local development only** — do not use them in a shared or production environment.

```bash
docker compose up -d    # Start
docker compose down     # Stop
```

---

## 🔧 Customizing the Boilerplate

1. **Clone and rename**
   ```bash
   git clone https://github.com/your-username/nest-api-boilerplate.git my-project
   cd my-project
   ```
   Update `name` in `package.json`. Reset git history if desired (`rm -rf .git && git init`).

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL, port, and JWT secrets
   ```

4. **Extend `prisma/schema.prisma`**
   Add your application-specific models. The `User` model can be extended with new relations. The `Session` model should remain unchanged.

5. **Create the initial migration**
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```
   Re-run after every schema change.

7. **Add application modules**
   Create `src/modules/<feature>/` with a module, controller, service, and DTOs following the `users` module as a template.

8. **Inject common services**
   Import `CommonModule` in your feature module to access `PaginationService`, `FilteringService`, `SortingService`, and `SearchingService`.

9. **Extend roles if needed**
   Add new values to the `Role` enum in `prisma/schema.prisma`, create a migration, and regenerate the client.

10. **Update Swagger documentation**
    Decorate your DTOs with `@ApiProperty` and your controllers/methods with `@ApiTags`, `@ApiOperation`, `@ApiResponse`.

11. **Add tests**
    Write unit tests for your services and e2e tests for your controllers. The Jest configuration is already in place.

---

## 🧠 Design Principles

- **Modularity** — feature modules encapsulate their own controllers, services, and DTOs and declare explicit dependencies through module imports.
- **Separation of concerns** — Prisma models, business logic, and API contracts are distinct layers connected by explicit mapper functions.
- **Reusable infrastructure** — cross-cutting concerns are implemented once and injected where needed.
- **Secure by default** — security-sensitive choices are on from the beginning, not bolted on later.
- **Centralised cross-cutting concerns** — one filter for all exceptions, one interceptor for all responses, one validation pipe for all inputs.
- **Explicit API contracts** — response DTOs are defined separately from Prisma models; the mapper makes the contract explicit and prevents accidental data leaks.
- **Simplicity over abstraction** — patterns are applied through composition and dependency injection rather than deep inheritance chains.

---

## 🚀 Future Improvements

These features are **not currently implemented** and represent natural next steps:

- **Redis-backed session store** — move session storage to Redis for horizontal scalability and faster revocation checks.
- **Rate limiting** — add request throttling (e.g., `@nestjs/throttler`) to auth endpoints to mitigate brute-force attacks.
- **Email verification** — require users to verify their email address before logging in.
- **Password reset** — implement a secure token-based password reset flow.
- **Structured logging** — replace the built-in `Logger` with a structured logging library (e.g., Pino) for log aggregation and querying.
- **Health checks** — add a `GET /health` endpoint (e.g., `@nestjs/terminus`) for container orchestration readiness probes.
- **CI/CD pipeline** — automated linting, testing, and deployment configuration.
- **Integration and e2e test coverage** — comprehensive tests for the authentication flow, user CRUD, and query utilities.

---
