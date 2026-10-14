# Clyde Interview Base: Agent Instructions

A trimmed copy of the production `clyde-api`, with the same stack and conventions. Follow these
rules exactly as you would in production.

## 🛠 Setup & Commands
* Install dependencies: `yarn install` (Yarn 4 via Corepack; never `npm install`)
* Local Postgres: `yarn db:up`, then `yarn migrate`
* Run development server: `yarn dev`
* Run typecheck: `yarn typecheck` (covers `src/` and `tests/`)
* Run lint: `yarn lint`
* Run tests: `yarn test`
  * **Targeting specific tests requires `--`:**
    * By file: `yarn test -- path/to/one.test.ts`
    * By test name: `yarn test -- -t "some test name"`

## ⚠️ Critical Invariants
1. **Thin Routers, Pure Controllers:** Routers live in `src/server/routers/` (mounted from `index.ts`).
   Controllers live in `src/server/controllers/<domain>/`. Routers validate and shape HTTP responses.
   Controllers contain pure business logic with NO Express `req`/`res` and no HTTP status numbers.
   They take a `ctx: RequestContext` (`@clyde-api/types/context`) as the last argument.
2. **Schema-Driven Contracts:** Define parameter and result shapes with Zod in
   `src/server/controllers/<domain>/schemas.ts`.
3. **Errors:** Throw `AppError` helpers from `@clyde-api/types/errors` (`notFound`, `validation`,
   `conflict`, ...). The global error handler in `src/server/index.ts` maps `code` to a status.
   Never `res.status(4xx)` from a controller.
4. **Database Rules:** Never run raw SQL in application code or change tables by hand. Every model
   change needs a new Knex migration (`yarn migrate:make <name>`).
5. **Logging:** Always use `@clyde-api/utils/logger`, never `console.log`. Log ids, not patient
   details. Fields named in `PHI_FIELDS` are redacted to `[PHI]`. If you add a new field that holds
   PHI, add its name there.
6. **Import aliases:** `@clyde-api/*` is defined twice, in `tsconfig.json` `paths` (compile time →
   `src/`) and in `package.json` `_moduleAliases` (runtime → `dist/`). A new top-level `src/`
   folder must go in both.

## Reference implementation
`patients` is the complete example of a vertical slice:
`migrations/*_create_patients.js` → `src/models/patient.ts` →
`src/server/controllers/patient/{schemas,PatientController}.ts` → `src/server/routers/patients.ts` →
`tests/controllers/patient/PatientController.test.ts`. Copy its shape for new features.

## Deploy
Render, declared in `render.yaml`. The Docker image runs `knex migrate:latest` and then
`node dist/index.js`. See the README's Deploying section.

## 🚫 Files to Avoid Modifying
* `knexfile.js`: shared by the app and the migration CLI.
* `dist/`: build output; never edit by hand.
