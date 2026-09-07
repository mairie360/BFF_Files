# BFF_Files — Technical documentation

[Module overview](module.md) · [Français](../fr/technical.md) · [README](../../README.md)

Documentation of the versioned code as of 7 September 2026, based on `f98be8eef769`. Commands below describe checks to run; they do not certify a remote deployment.

## Architecture and request handling

Express 5.2.1 server written in TypeScript. Zod schemas and their OpenAPI registry describe exchanged objects; routers adapt upstream services to interface needs.

`src/routes/files.ts` validates bootstrap and forwards library operations. `src/clients/upstream.ts` forwards authorization, applies a 10-second timeout and preserves status, content type, disposition and ETag. Downloads remain binary; a 204 deletion remains bodyless.

## Data and persistence

Bootstrap reads Files API `/api/v1/files/`, `/api/v1/file-categories/` and Core `/api/v1/user/me/`. Files API supplies `canUpload` and `allowedActions`. The BFF forwards bytes and metadata; it does not durably store files or replace missing responses with demo data.

Files API routes and persistence must be available in the deployment. BFF uploads are limited to 20 MiB. The web service hides sharing until a recipient selector is available, even though BFF routes exist.

## Installation and local startup

Use Node.js 22 to reproduce the contract job and npm with the committed lockfile. Other job and Docker versions are detailed below.

Current direct dependencies include no private `@mairie360/*` client. `.npmrc` still retains the organization’s registry configuration.

```bash
npm ci
```

Create `.env` in the repository root. Local HTTP configuration example to adapt to the running services:

```dotenv
PORT=4005
CORE_API_URL=http://localhost:3000
FILES_API_URL=http://localhost:3005
```

```bash
npm run start
```

`PORT` is optional; the `src/index.ts` fallback is `4005`.

Check the process, then open the interactive documentation:

```bash
curl --fail --silent --show-error http://localhost:4005/health
```

Swagger UI: `http://localhost:4005/docs`. JSON specification: `/openapi.json`, with `/swagger.json` as an alias. `/health` checks the process; `/check_apis` is a separate dependency diagnostic.

## Configuration

Values below are local examples or explicitly described behavior, not production credentials.

| Variable or precedence | Example / stated fallback | Purpose |
| --- | --- | --- |
| `PORT` | 4005 | Port used by this local example. |
| `CORE_API_URL` | http://localhost:3000 | Core base address without a route suffix. |
| `FILES_API_URL` | http://localhost:3005 | Plural name required by the client; `FILE_API_URL` is not an alias. |
| `CORE_API_PORT` / `FILES_API_PORT` | — | Optional ports when absent from the URLs. |

## Routes and data contract

Inventory extracted from `contracts/openapi.json`. Replace brace parameters with real identifiers. Detailed types, required fields, responses and any examples are defined in that contract; table statuses are the declared statuses, not an exhaustive list of transport or validation errors.

| Method | Path | Declared body | Declared statuses |
| --- | --- | --- | --- |
| GET | `/health` | — | 200 |
| GET | `/check_apis` | — | 200, 502 |
| GET | `/files/bootstrap` | — | 200, 401, 502 |
| GET | `/files` | — | 200, 201, 204, 401, 502 |
| POST | `/files` | multipart/form-data | 200, 201, 204, 401, 502 |
| GET | `/files/{fileId}` | — | 200, 201, 204, 401, 502 |
| DELETE | `/files/{fileId}` | — | 200, 201, 204, 401, 502 |
| GET | `/files/{fileId}/download` | — | 200, 201, 204, 401, 502 |
| POST | `/files/{fileId}/shares` | application/json | 200, 201, 204, 401, 502 |
| DELETE | `/files/{fileId}/shares/{shareId}` | — | 200, 201, 204, 401, 502 |

## Session, permissions and errors

All `/files` routes require a Bearer token and forward identity to the owning API. Permission flags drive the interface while enforcement remains on the server. Configuration, transport or schema errors do not trigger a local save.

## Synchronization and verification

```bash
npm run contracts:generate
npm run contracts:check
npm test -- --runInBand
npm run lint
npm run build
```

`contracts:generate` exports the runtime registry to `contracts/openapi.json` and regenerates `contracts/bff.d.ts`. `contracts:check` fails when the contract or types are stale. Then run `npm run contracts:sync` in each associated web service and deliver contract changes together.

The type generator is pinned to `openapi-typescript@7.10.1` in `scripts/contracts.mjs` and runs through npm. For documentation-only changes, check links, accuracy in both languages and `git diff --check`; do not regenerate contracts without changing their source.

## CI/CD and Docker execution

The `contracts.yml` job uses Node.js 22, `actions/checkout@v7` and `actions/setup-node@v7`. It runs on pushes, pull requests and manual dispatch; it installs with `npm ci`, checks contracts and runs the associated tests.

`cicd.yml` calls `mairie360/CICD/.github/workflows/BFFs-cicd.yml@v1.13.2`, with `cicd_version: v1.13.2` and `node_version: "22"`. Reusable steps and GitHub environments determine actual checks, publications and deployments.

The Dockerfile currently uses `node:20-alpine` for build and runtime; the image command is `["node", "dist/index.js"]`. That version is separate from the Node.js 22 contract job.

Before running Docker, check service variables, build secrets and networks in the repository files. Green CI validates its jobs; it does not prove business-service availability in a remote environment.

## Troubleshooting

A legacy `FILE_API_URL` setting does not configure this client: use `FILES_API_URL`. If the library loads without actions, inspect API permission fields. If a file cannot be downloaded, check the upstream `/content` route and its headers.

## Repository reference

- [src/app.ts](../../src/app.ts)
- [src/routes/files.ts](../../src/routes/files.ts)
- [src/clients/upstream.ts](../../src/clients/upstream.ts)
- [contracts/openapi.json](../../contracts/openapi.json)
- [contracts/bff.d.ts](../../contracts/bff.d.ts)
- [scripts/contracts.mjs](../../scripts/contracts.mjs)
- [package.json](../../package.json)
- [.github/workflows/contracts.yml](../../.github/workflows/contracts.yml)
- [.github/workflows/cicd.yml](../../.github/workflows/cicd.yml)
- [Dockerfile](../../Dockerfile)
- [docker-compose.yml](../../docker-compose.yml)

Historical supplements: [CONTRACT.md](../../CONTRACT.md). Proposed requirements must remain distinct from implemented behavior.
