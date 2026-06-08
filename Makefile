.PHONY: local-stack-up local-stack-down local-stack-ps local-stack-logs local-stack-seed

local-stack-up:
	docker compose up --build -d

local-stack-down:
	docker compose down

local-stack-ps:
	docker compose ps

local-stack-logs:
	docker compose logs -f

local-stack-seed:
	docker compose exec backend node dist/db/seed.js
