# NexBand backend

Standalone Fastify API for NexBand. It is intentionally separate from the Next.js UI: no files in `frontend/` are required to start or test this service.

## Run locally

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

The API starts at `http://127.0.0.1:4000`, and its health check is available at `GET /api/v1/health`.

Useful commands:

```bash
npm run typecheck
npm test
npm run build
npm start
```

See [architecture.md](docs/architecture.md) for the module and storage design, and [API.md](docs/API.md) for the initial API contract.

## Important persistence note

The supplied `Memory*Repository` classes are a development/test adapter. They are intentionally non-persistent and data resets whenever the process restarts. The application only depends on repository interfaces, so the production step is to implement those interfaces with PostgreSQL and replace `createMemoryRepositories()` in `src/app.ts`. Do that before deploying real user data.
