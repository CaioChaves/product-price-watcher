## Why

Currently, setting up and running the product price watcher application requires installing Node.js/TypeScript on the host machine and manually running development servers for the frontend and backend. Dockerizing the stack allows developers and users to launch and manage the entire application stack locally using simple Docker and Make commands, without needing Node.js or any other runtime dependencies installed on the host.

## What Changes

- Add backend `Dockerfile` and `.dockerignore` for containerized compilation and execution of the backend service.
- Add frontend `Dockerfile`, custom `nginx.conf`, and `.dockerignore` to serve the production-ready build of the frontend with reverse proxy capabilities.
- Add root `docker-compose.yml` to orchestrate both services, exposing the frontend on port `8080` and establishing a container network.
- Add root `Makefile` exposing `local-stack-up`, `local-stack-down`, and `local-stack-ps` commands.
- Modify `frontend/src/App.tsx` and `frontend/vite.config.ts` to use relative API routing (`/api`) instead of a hardcoded URL, resolving CORS and port conflicts seamlessly.

## Capabilities

### New Capabilities
- `local-stack`: Capability to launch, stop, and inspect the entire application stack locally using Docker containers and a Makefile.

### Modified Capabilities
- None

## Impact

- **Local Development Flow**: Adds a container-based run path using `make local-stack-up`. The host machine only requires Docker and Make to run the entire app.
- **Frontend Configuration**: Modifies the API routing scheme in React, transitioning from a hardcoded `localhost:3001` to `/api`. This requires configuring Vite's development server proxy for local host-based development (`npm run dev`).
- **Dependencies**: Adds container image build stages, Nginx container layer, and named volume persistence for SQLite.
