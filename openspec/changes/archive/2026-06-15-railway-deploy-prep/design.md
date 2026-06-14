## Context

The project is a two-service monorepo (React/nginx frontend + Express/SQLite backend). Both services have Dockerfiles and `railway.json` files and are intended to run as separate Railway services. The problem is a set of three config mismatches that prevent local end-to-end testing and create a latent Railway deployment bug:

1. `docker-compose.yml` doesn't pass any environment variables to the frontend service, so nginx starts with `BACKEND_HOST=product-price-watcher.railway.internal` — a Railway-specific hostname that doesn't resolve in Docker's network. The nginx proxy to `/api` silently fails.

2. `backend/Dockerfile` bakes in `ENV PORT=3001`, but the frontend's `entrypoint.sh` defaults `BACKEND_PORT` to `8080`. When Railway overrides `PORT` at runtime, the backend listens on whatever Railway injects — but if that value doesn't match `8080`, the proxy breaks.

3. SQLite database files (`backend/data/*.db`) are tracked in git. They're already excluded from Docker images via `.dockerignore`, but committing them pollutes history and can cause confusion.

## Goals / Non-Goals

**Goals:**
- `docker compose up --build` starts both services with the nginx→backend proxy working end-to-end
- Backend Dockerfile PORT default aligns with the frontend's `BACKEND_PORT` assumption (`8080`)
- SQLite files are git-ignored at the repo root

**Non-Goals:**
- Railway volume setup (must be done in Railway dashboard — cannot be code-driven)
- Railway PR environments (dashboard toggle, no code change needed)
- Changes to application logic, API, or database schema

## Decisions

### Docker network: use service name as BACKEND_HOST

In Docker Compose, services resolve each other by their service name via Docker's embedded DNS (`127.0.0.11`). The backend service is named `backend`, so the frontend needs `BACKEND_HOST=backend`. The `BACKEND_PORT` must match the port the backend listens on inside the container — `3001` locally (from Dockerfile default or `.env`), `8080` on Railway.

Alternative considered: use `host.docker.internal` — rejected, non-portable and unnecessary inside Docker Compose networking.

### PORT default: standardize on 8080

The backend `ENV PORT=3001` default is a leftover from pre-Railway development. The frontend's `BACKEND_PORT` default is `8080` (set during Railway fixes in prior commits). We align the backend Dockerfile to `8080` so the defaults are consistent. Railway will inject its own `PORT` at runtime regardless; this only affects the local fallback.

Alternative: keep `3001` in Dockerfile, override to `8080` in Railway dashboard. Rejected — having two different defaults for the same value in the same repo is confusing.

### .gitignore scope: repo root

Add entries at the repo root `.gitignore` rather than a subdirectory `.gitignore`. The existing root `.gitignore` only has `*.env` — adding DB files there keeps all ignore rules in one place and is consistent with the repo's current style.

## Risks / Trade-offs

- **Port 8080 conflict on developer machines**: Port 8080 is commonly used. If a developer already has something on 8080, `docker compose up` will fail on the frontend mapping. Low risk for a side project; can be overridden via `BACKEND_PORT` in `.env` if needed. → No mitigation needed now.

- **Existing git-tracked DB files**: Changing `.gitignore` won't remove already-tracked files from git. The `backend/data/` files currently in the repo need to be removed from git tracking (`git rm --cached`) as a one-time cleanup step. → Handled in tasks.
