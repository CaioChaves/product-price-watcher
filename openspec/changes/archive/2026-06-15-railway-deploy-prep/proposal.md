## Why

The project cannot be fully tested locally because `docker-compose.yml` doesn't pass the correct environment variables to the frontend service, leaving the nginx→backend proxy broken. Additionally, the backend Dockerfile hardcodes `PORT=3001` while Railway's frontend proxy assumes port `8080`, and SQLite DB files are accidentally tracked in git.

## What Changes

- Fix `docker-compose.yml`: pass `BACKEND_HOST=backend`, `BACKEND_PORT=3001`, and `PORT=80` to the frontend service so the nginx proxy resolves correctly inside Docker's network
- Fix `backend/Dockerfile`: change `ENV PORT=3001` → `ENV PORT=8080` to align with the Railway frontend's `BACKEND_PORT` default of `8080`
- Fix `.gitignore`: add `backend/data/` and `*.db` so SQLite files are not tracked in git (they are already excluded from Docker via `.dockerignore`)

## Capabilities

### New Capabilities

- `local-testing`: Full-stack local test flow using `docker compose up --build`, with the frontend nginx proxy correctly routing `/api` to the backend

### Modified Capabilities

<!-- none — no spec-level behavior changes, these are infra/config-only fixes -->

## Impact

- `docker-compose.yml` — frontend service gets new `environment` block
- `backend/Dockerfile` — single `ENV` line changes
- `.gitignore` — two new entries added
