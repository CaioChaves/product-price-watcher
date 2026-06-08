## Context

Currently, the Product Price Watcher consists of an Express backend (using a local SQLite database) and a React/Vite frontend. To run the application, developers must manually run `npm run dev` in both the `backend/` and `frontend/` folders. This requires local installation of Node.js and TypeScript, and relies on hardcoded local host port routing (`localhost:3001` for API), which can conflict with other applications. 

Dockerizing the entire stack and introducing a Makefile will simplify local execution, isolate dependencies, and improve developer experience.

## Goals / Non-Goals

**Goals:**
- Containerize the frontend served by Nginx and the backend running Node.js.
- Persist the SQLite database across container restarts.
- Configure automatic WhatsApp alerts configuration using host/env files passed into the container.
- Establish clean relative routing (`/api`) using Nginx as a reverse proxy in Docker, and Vite proxy for host-based development.
- Expose a simple control interface via a `Makefile` with commands for up, down, status, logs, and database seeding.

**Non-Goals:**
- Setting up a cloud deployment pipeline (e.g., Kubernetes, AWS, GCP).
- Migrating from SQLite to another database engine (e.g., PostgreSQL).
- Automating Docker image publication to a registry.

## Decisions

### Decision 1: API Routing using Nginx Reverse Proxy
- **Choice**: Modify the frontend to use relative `/api` paths. In Docker, Nginx serves the built static files on port `8080` and reverse proxies `/api` requests to the `backend` container on port `3001`. For local non-Docker development, configure Vite's development server proxy in `vite.config.ts` to redirect `/api` to `localhost:3001`.
- **Rationale**: Removes hardcoded host/port configurations from the built client application and resolves all Cross-Origin Resource Sharing (CORS) issues.
- **Alternatives Considered**: Direct host-level communication (keeping `http://localhost:3001/api` in code). This would require exposing both backend and frontend ports to the host machine and is fragile if ports are occupied.

### Decision 2: Named Volume for SQLite Database Persistence
- **Choice**: Use a Docker named volume (`backend-data`) mapped to `/usr/src/app/data` inside the backend container.
- **Rationale**: The SQLite database file (`price_watcher.db`) resides in the backend's data folder. Named volumes ensure that data persists even when the containers are stopped, removed, or updated.
- **Alternatives Considered**: Host bind-mounts. Bind-mounts can lead to permission issues on Linux/macOS host machines because of mismatched UID/GIDs. Named volumes are managed by Docker and avoid this friction.

### Decision 3: Multi-stage Build for Backend
- **Choice**: Use a multi-stage `Dockerfile` with `node:20-slim`. The builder stage installs python3, make, and g++ to compile the native bindings of `better-sqlite3`, builds the TypeScript code, and then the runner stage only copies the required compiled files and production `node_modules`.
- **Rationale**: Keeps the final image size minimal while ensuring that native node modules compile successfully.
- **Alternatives Considered**: Alpine-based builds. While smaller, compiling native Node modules on Alpine is often more complex due to musl vs. glibc library differences.

## Risks / Trade-offs

- **[Risk]** SQLite WAL mode files (`-wal` and `-shm`) can occasionally get locked if the container is killed abruptly.
  - **Mitigation**: Standard container restart policies (`restart: always`) and proper Signal Handling in Node (which Express has natively) ensure graceful termination on `docker compose down`.
- **[Risk]** Lack of Node.js on the host machine makes running database seeding difficult.
  - **Mitigation**: Expose a `make local-stack-seed` target that triggers `docker compose exec backend node dist/db/seed.js` to run the seed script directly inside the container environment.
