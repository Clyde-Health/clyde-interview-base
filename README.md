# clyde-interview-base

> **This is the same setup we run in production at Clyde today.**
> This repo is a trimmed copy of our production API (`clyde-api`). It has the same stack, the same
> folder layout and layering, the same error model, the same logger with PHI redaction, the same
> tooling, and the same deploy model (Docker on Render). We left out a few production-only pieces
> on purpose; see the table below. Nothing here is a toy version of our stack. Code you write in this
> repo would drop into our real codebase following the same patterns, and that's what the interview
> looks at.

| Same as production | Left out here (production-only) |
|---|---|
| Node 22, TypeScript compiled to CommonJS | Temporal workflows and workers |
| Express 5, `asyncHandler`, global error handler | Redis |
| Zod schemas for every request/response | Supabase auth |
| Knex migrations + Objection models on Postgres | GrowthBook feature flags |
| Router → Controller → Model layering | Datadog log shipping |
| `AppError` error model (`code` → HTTP status) | Partner integrations (Twilio, Vapi, EHR connectors) |
| Winston logger with PHI field redaction | Auth middleware and multi-tenant organizations |
| Jest + ts-jest, ESLint + Prettier, Yarn 4 | Staging environment and manual prod promotion |
| Docker image deployed to Render, health-checked on `/healthz` | Supabase-hosted Postgres (Render Postgres here) |

## The assignment

Your task is here:
**[Take-Home: AI Insurance Verification Agent](https://wool-pot-615.notion.site/Take-Home-AI-Insurance-Verification-Agent-3f953aa3160a803eb026cfc22bb6bf65)**

Build your solution on top of this repo. The `patients` feature that ships with it is a worked
example of the pattern: one migration, one model, one controller, one router, one test. It is only a
reference. It does not solve any part of the take-home. Copy its shape for whatever you add.

---

## Prerequisites

- **Node 22**: `nvm use` picks it up from `.nvmrc`
- **Corepack**: run `corepack enable` once. It installs the Yarn version pinned in `package.json`, so
  you don't install Yarn yourself.
- **Docker Desktop**, *running*. It provides the local Postgres.

## Quickstart (about 5 minutes)

```bash
yarn                       # install dependencies
cp .env.example .env       # local config (defaults already match docker-compose)
yarn db:up                 # start Postgres 17 in Docker on :5432
yarn migrate               # create the tables
yarn dev                   # compile + run, restarting on every save
```

Then:

```bash
curl localhost:4000/healthz
# {"status":"ok","database":{"reachable":true,...}}

curl -X POST localhost:4000/patients \
  -H 'content-type: application/json' \
  -d '{"first_name":"Ada","last_name":"Lovelace","date_of_birth":"1990-12-10","phone_number":"+15555550123"}'

curl localhost:4000/patients
```

## How the code is organized

```
src/
  index.ts                       entry: load .env → register aliases → connect DB → listen
  config/init.ts                 connects services at startup (only Postgres here)
  server/
    index.ts                     Express app: middleware, routers, global error handler
    routers/<domain>.ts          HTTP layer: validate with Zod, build ctx, call controller, res.json()
    controllers/<domain>/
      XController.ts             business logic: no req/res, no status codes; throws AppError
      schemas.ts                 Zod schemas for params and results
    middleware/                  request id, etc.
  models/<table>.ts              Objection models
  types/errors.ts                AppError + helpers (notFound, validation, conflict, ...)
  utils/                         logger, database, asyncHandler, env, cors
migrations/                      Knex migrations (plain JS)
tests/                           Jest tests, mirroring src/
```

A request flows like this:

```
HTTP request
  → router          parse(Schema, req.body)  → 400 validation_error if invalid
  → controller      pure logic, talks to models, throws AppError.notFound(...) etc.
  → model           Objection query against Postgres
  ← router          res.json({ ... })
  ↳ on any throw    global error handler maps err.code → status, logs it, returns { error, code, requestId }
```

**Rules we hold in production (and here):**

1. **Thin routers, pure controllers.** Routers do validation and HTTP. Controllers never import
   Express and never pick status codes.
2. **Zod for every contract.** Request shapes live in `controllers/<domain>/schemas.ts`.
3. **Errors are `AppError`s.** Throw `AppError.notFound(...)`, `AppError.validation(...)` and so
   on. The global handler in `src/server/index.ts` turns `code` into a status.
4. **Schema changes are migrations.** Never change tables by hand. Run `yarn migrate:make <name>`.
5. **Use the logger, and log ids rather than people.** `@clyde-api/utils/logger` replaces any field
   named in `PHI_FIELDS` (names, dates of birth, phone numbers, insurance member ids, ...) with
   `[PHI]` before it prints. That's a HIPAA requirement in production.

**Import aliases.** `@clyde-api/*` maps to `src/*` at compile time (`tsconfig.json` `paths`) and to
`dist/*` at runtime (`_moduleAliases` in `package.json`). If you add a new top-level folder under
`src/`, add it to **both** lists.

## Adding an endpoint (follow the patients example)

1. **Migration:** `yarn migrate:make create_widgets`, then edit the new file in `migrations/` and run
   `yarn migrate`.
2. **Model:** `src/models/widget.ts`, extending `Base` from `@clyde-api/utils/baseModel`.
3. **Schemas:** `src/server/controllers/widget/schemas.ts`, with Zod schemas for the body, params
   and result.
4. **Controller:** `src/server/controllers/widget/WidgetController.ts`. Export a class and a
   singleton, and take a `ctx: RequestContext` as the last argument.
5. **Router:** `src/server/routers/widgets.ts`. Validate, call the controller, respond. Mount it in
   `src/server/routers/index.ts`.
6. **Test:** `tests/controllers/widget/WidgetController.test.ts`.

## Commands

| Command | What it does |
|---|---|
| `yarn dev` | Watch mode: recompiles `src/` into `dist/` and restarts on each save |
| `yarn build` / `yarn start` | One-off compile / run the compiled app |
| `yarn test` | Unit tests (Jest). Run one file: `yarn test -- tests/controllers/patient` |
| `yarn typecheck` | Type-check `src/` **and** `tests/` |
| `yarn lint` | ESLint + Prettier. Fix formatting with `yarn prettier --write "src/**/*.ts"` |
| `yarn migrate` / `yarn migrate:down` | Apply / roll back migrations |
| `yarn migrate:make <name>` | New migration file |
| `yarn db:up` / `yarn db:down` | Start / stop local Postgres (`:5432`, plus a throwaway test DB on `:5433`) |

---

## Deploying (Render)

Production runs on Render, and so does this repo. Everything Render needs is declared in
`render.yaml` (the "Blueprint"), so there is nothing to configure by hand.

### First deploy (about 15 minutes, mostly waiting for the build)

1. **Push the repo to GitHub.** Use your own copy, either a fork or a new repo.
2. Create a free account at [render.com](https://render.com) and connect your GitHub account.
3. In Render, click **New → Blueprint** and pick the repo. Render reads `render.yaml` and shows two
   resources:
   - `interview-db`, a Postgres 17 database
   - `clyde-interview-api`, a web service built from the `Dockerfile`
4. Click **Apply**. Render creates the database, injects its connection string as `DB_URL`, builds
   the Docker image and starts it. On start the container runs `knex migrate:latest` and then the
   API.
5. When the service shows **Live**, open its URL:
   ```bash
   curl https://<your-service>.onrender.com/healthz
   ```

### After that

- **Every push to `main` deploys automatically** once CI passes. CI is `.github/workflows/ci.yml`,
  which runs lint, typecheck, tests, build and a Docker build.
- **Migrations run on every deploy**, before the server starts. Commit a new migration file and push.
- **Logs:** go to the service, then **Logs**. This is the same logger output you see locally.
- **Environment variables and secrets:** go to the service, then **Environment**. Add them there,
  never in the repo. To make a new variable part of the Blueprint, add it to `render.yaml` with
  `sync: false` so Render prompts for the value.
- **Roll back:** go to the service, then **Events**, and pick an earlier deploy, then **Rollback**.
  Migrations don't roll back automatically. Run `node_modules/.bin/knex migrate:down` from the
  service's **Shell** tab if you need to (Shell is only on paid plans).
- **Connect to the database:** go to `interview-db`, then **Connect**, and copy the *External*
  connection string into `psql` or a GUI.

### Free-tier caveats

- A free web service sleeps after 15 minutes without traffic, and the first request after that takes
  about a minute. That's fine for a demo. Hit `/healthz` before you show it to someone.
- A free Render Postgres database **expires after 30 days**. Upgrade it, or re-create it from the
  Blueprint.
- `preDeployCommand` (running migrations as a separate step before traffic switches) needs a paid
  instance. That's why the Dockerfile runs migrations at container start.

### Test the production image locally (optional)

```bash
docker build -t clyde-interview-api .
docker run --rm -p 4000:4000 \
  -e DB_URL=postgres://interview:interview@host.docker.internal:5432/interview \
  -e DB_SSL=false \
  clyde-interview-api
```

---

## Troubleshooting

**`Could not connect to Postgres at localhost:5432. Nothing is listening there.`**
Postgres isn't running. Start Docker Desktop, then run `yarn db:up`. Check it with `docker compose ps`.

**`port 5432 is already allocated` on `yarn db:up`**
Another Postgres is already using the port (often a Homebrew one: `brew services stop postgresql@17`).
Either stop it, or change the left-hand port in `docker-compose.yml` and set `DB_PORT` in `.env` to
match.

**`Cannot find module '@clyde-api/...'` at runtime, but it compiles**
You added a folder under `src/` and listed it in `tsconfig.json` `paths` but not in `_moduleAliases`
in `package.json`, or the other way round. Add it to both.

**`This project is configured to use yarn@4.9.4` / wrong Yarn version**
Run `corepack enable`. Don't install Yarn globally with npm.

**Render deploy fails on `yarn install --immutable`**
`yarn.lock` is out of date. Run `yarn` locally and commit the lockfile.
