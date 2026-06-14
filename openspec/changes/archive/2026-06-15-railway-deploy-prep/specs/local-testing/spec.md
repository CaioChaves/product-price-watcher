## ADDED Requirements

### Requirement: Full stack runs locally with docker compose
The system SHALL support running the complete frontend + backend stack locally using `docker compose up --build` with no additional configuration required beyond what is in the repository.

#### Scenario: Frontend serves the UI
- **WHEN** a developer runs `docker compose up --build`
- **THEN** the frontend is accessible at `http://localhost:8080` and the React UI loads

#### Scenario: API proxy routes correctly
- **WHEN** the frontend makes a request to `/api/products`
- **THEN** nginx proxies it to the backend service and returns a valid JSON response

#### Scenario: Backend data persists between restarts
- **WHEN** a product is added and then `docker compose restart` is run
- **THEN** the product still appears in the product list after restart

### Requirement: Backend PORT default is consistent with frontend proxy assumption
The backend Dockerfile SHALL default `PORT` to `8080` so that the backend's default port matches the frontend's `BACKEND_PORT` default, eliminating a silent mismatch.

#### Scenario: Backend listens on 8080 by default
- **WHEN** the backend Docker image is started without a `PORT` environment variable override
- **THEN** the server listens on port `8080`

### Requirement: SQLite database files are not tracked in git
The repository `.gitignore` SHALL exclude `backend/data/` and `*.db` files so that SQLite database files are never committed.

#### Scenario: Database files are ignored
- **WHEN** a developer runs `git status` after the backend has created its database
- **THEN** the `backend/data/` directory and its contents do not appear as untracked or modified files
