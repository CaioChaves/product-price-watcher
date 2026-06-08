## 1. Routing & API configuration

- [x] 1.1 Update the hardcoded API_BASE to relative `/api` in `frontend/src/App.tsx`
- [x] 1.2 Update `frontend/vite.config.ts` to include a local development proxy redirecting `/api` requests to `localhost:3001`

## 2. Containerization

- [x] 2.1 Create `backend/Dockerfile` with a multi-stage build (builder + runner slim)
- [x] 2.2 Create `backend/.dockerignore` to exclude local Node.js binaries and data files
- [x] 2.3 Create `frontend/Dockerfile` with a multi-stage build (builder + Nginx server)
- [x] 2.4 Create `frontend/nginx.conf` in the frontend directory containing a reverse proxy for `/api` pointing to `http://backend:3001/api/`
- [x] 2.5 Create `frontend/.dockerignore` to exclude local React build outputs and node modules
- [x] 2.6 Create `docker-compose.yml` in the project root defining frontend and backend services, environment files, and a named volume (`backend-data`)

## 3. Host Control Interface

- [x] 3.1 Create root `Makefile` containing tasks for `local-stack-up`, `local-stack-down`, `local-stack-ps`, `local-stack-logs`, and `local-stack-seed`

## 4. Verification

- [x] 4.1 Execute `make local-stack-up` to spin up containers locally
- [x] 4.2 Validate browser access at `http://localhost:8080` and verify frontend dashboard is rendering active monitored products
- [x] 4.3 Populate mock data in the database using `make local-stack-seed` and verify database persistence survives a `make local-stack-down` and subsequent `make local-stack-up` recreation cycle
