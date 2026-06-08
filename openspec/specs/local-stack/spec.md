# local-stack Specification

## Purpose
TBD - created by archiving change dockerize-local-stack. Update Purpose after archive.
## Requirements
### Requirement: Local Containerized Stack Control
The local development environment MUST support starting, stopping, and checking the status of both frontend and backend services via Docker containers and Docker Compose using a root `Makefile`.

#### Scenario: Spin up the local stack
- **WHEN** the user runs `make local-stack-up`
- **THEN** both the backend and frontend containers SHALL be built, started in detached mode, and the frontend SHALL be accessible at `http://localhost:8080`

#### Scenario: Bring down the local stack
- **WHEN** the user runs `make local-stack-down`
- **THEN** both containers SHALL be stopped and removed, and the network cleaned up, while database volumes SHALL be preserved

#### Scenario: Check container status
- **WHEN** the user runs `make local-stack-ps`
- **THEN** the list of running containers and their states SHALL be printed to the stdout

### Requirement: SQLite Database Persistence
The containerized backend database MUST persist data across stack restarts and container recreations.

#### Scenario: Data survives stack recreation
- **WHEN** the stack is brought down using `make local-stack-down` and brought back up using `make local-stack-up`
- **THEN** the database content from the previous session SHALL remain intact and available to the backend service

### Requirement: Database Seeding in Container
The local stack MUST support seeding the database within the container.

#### Scenario: Execute database seed
- **WHEN** the user runs `make local-stack-seed`
- **THEN** the seed script inside the running backend container SHALL execute and populate the database with mock records

