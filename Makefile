.PHONY: run test lint frontend-build

run:
	docker compose up --build --remove-orphans

test:
	cd backend && uv run pytest --cov=series_app --cov-report=term-missing

lint:
	cd backend && uv run ruff check src tests

frontend-build:
	cd frontend && npm install --no-audit --no-fund && npm run build

docker-run:
	docker compose up --build --remove-orphans

docker-run-force:
	docker compose up --build --force-recreate --remove-orphans
