# NexBand backend

Standalone Fastify API for NexBand. It is intentionally separate from the Next.js UI: no files in `frontend/` are required to start or test this service.

## Run locally

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

The API starts at `http://127.0.0.1:4000`, and its service check is available at `GET /`.

Useful commands:

```bash
npm run typecheck
npm test
npm run build
npm start
```

See [architecture.md](docs/architecture.md) for the module and storage design, and [API.md](docs/API.md) for the current API contract.

## Important persistence note

The reading and listening modules persist mock tests, learner attempts, answers,
and results through Prisma/PostgreSQL. Apply all migrations before running the
API against a new database:

```bash
npx prisma migrate deploy
```
