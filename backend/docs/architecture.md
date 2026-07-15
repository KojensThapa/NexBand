# Backend architecture

## Scope

This backend owns durable application behavior while the existing Next.js project remains the presentation layer. The frontend was deliberately not changed: its current local-storage functions can be migrated one-by-one to this API without redesigning any components or routes.

## Layout

```text
src/
  config/                    Environment parsing and startup policy
  core/                      Errors, HTTP validation, and password security
  infrastructure/persistence Repository interfaces and adapters
  modules/
    auth/                    Student/admin registration, login, current user
    exams/                   Public catalog and protected content administration
    submissions/             Learner attempts and analysis lifecycle creation
    reports/                 Learner report access
    health/                  Service metadata and health check
  plugins/                   JWT authentication and role guard
  app.ts                     Dependency composition and HTTP plugins
  server.ts                  Process startup and graceful shutdown
```

Each module owns its schemas, service, and routes. Routes only handle HTTP concerns; services enforce business rules; repositories isolate data access. This prevents a future database or queue change from leaking into request handlers or the frontend.

## Domain boundaries

| Module | Responsibility | Main entities |
| --- | --- | --- |
| Auth | Account identity and access tokens | `User`, `StoredUser` |
| Exams | Admin-authored IELTS material and the learner-visible catalog | `Exam` |
| Submissions | A learner's test attempt and analysis request | `Submission` |
| Reports | AI/marking results delivered to the learner | `Report` |

`Exam.content` is learner-visible task data. `Exam.answerKey` is admin-only marking data and is stripped from every public `/tests` response.

## Security defaults

- Passwords are salted and hashed with Node's `scrypt`; plaintext passwords are never stored.
- Authentication uses signed, expiring JWT bearer tokens.
- Admin routes require an `admin` role, not just a valid token.
- CORS is restricted to `CORS_ORIGIN` (the existing frontend defaults to `http://localhost:3000`).
- Helmet and an API-wide rate limit are registered before routes.
- Public errors avoid exposing internal exception detail.
- Open admin registration is configurable and should be disabled after bootstrapping the first production administrator.

## Persistence path

`src/infrastructure/persistence/repositories.ts` defines the data ports used by every service. `memory-repositories.ts` supplies a working adapter for development and automated tests only.

Before production, implement `AppRepositories` with PostgreSQL, add migrations, and create repositories for `users`, `exams`, `submissions`, and `reports`. Do not persist passwords, tests, or reports in the memory adapter. The dependency composition in `src/app.ts` is the only place that needs to choose the Postgres implementation.

## Analysis workflow

Submitting an attempt creates a `Submission` in `processing` state and a linked `Report` in `pending` state, so the HTTP request does not need to wait for AI scoring or audio processing.

The next backend increment should add a worker that consumes submitted attempts, writes skill-specific feedback into `Report.detail`, marks the report `completed` or `failed`, and updates the submission state. A durable queue and object storage should be added with that worker for speech recordings and uploaded images/audio. This initial API does not pretend to generate AI feedback itself.

## Frontend migration path

The current UI uses browser-local authentication, authored content, and mock reports. When the API is ready to be connected, retain all components and visual design, then replace only these data boundaries:

1. `frontend/lib/auth/local-auth.ts` and admin auth functions → `/api/v1/auth/*`.
2. `frontend/lib/admin/*-storage.ts` → protected `/api/v1/admin/tests` operations.
3. Test loaders → public `/api/v1/tests` operations.
4. Mock submission analysis/report storage → `/api/v1/submissions` and `/api/v1/reports`.

That sequencing keeps UI and backend work independently deployable.
