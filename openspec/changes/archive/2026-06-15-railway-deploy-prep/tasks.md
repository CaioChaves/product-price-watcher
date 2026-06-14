## 1. Fix docker-compose for local testing

- [x] 1.1 Add `environment` block to the `frontend` service in `docker-compose.yml` with `BACKEND_HOST=backend`, `BACKEND_PORT=3001`, and `PORT=80`
- [x] 1.2 Verify `docker compose up --build` starts both services and the UI loads at `http://localhost:8080`
- [x] 1.3 Verify `/api/products` returns data through the nginx proxy (check browser network tab or curl)

## 2. Fix backend Dockerfile PORT default

- [x] 2.1 Change `ENV PORT=3001` to `ENV PORT=8080` in `backend/Dockerfile`

## 3. Fix .gitignore for SQLite files

- [x] 3.1 Add `backend/data/` and `*.db` entries to the root `.gitignore`
- [x] 3.2 Untrack already-committed DB files: run `git rm --cached backend/data/price_watcher.db backend/data/price_watcher.db-shm backend/data/price_watcher.db-wal` (ignore errors for files that don't exist)
