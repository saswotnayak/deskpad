.PHONY: dev build deploy logs restart stop clean help status local-start local-stop local-restart local-logs local-status

## —— DeskPad ——————————————————————————————————————————

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Start development environment (with hot-reload)
	docker compose -f docker-compose.dev.yml up --build

dev-d: ## Start development environment (detached)
	docker compose -f docker-compose.dev.yml up --build -d

build: ## Build production images
	docker compose build

deploy: ## Deploy production stack
	docker compose up -d --build

logs: ## Tail production logs
	docker compose logs -f

logs-dev: ## Tail development logs
	docker compose -f docker-compose.dev.yml logs -f

restart: ## Restart all production services
	docker compose restart

stop: ## Stop all services
	docker compose down
	docker compose -f docker-compose.dev.yml down

clean: ## Remove containers, images, and volumes
	docker compose down --rmi local -v
	docker compose -f docker-compose.dev.yml down --rmi local -v

status: ## Show running containers
	docker compose ps

local-start: ## Start frontend and backend locally (detached)
	@echo "Starting backend..."
	@mkdir -p backend/data
	@cd backend && ENVIRONMENT=development PORT=3001 DB_PATH=./data/deskpad.db .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload > backend.log 2>&1 & echo $$! > backend.pid
	@echo "Starting frontend..."
	@cd frontend && npm run dev > frontend.log 2>&1 & echo $$! > frontend.pid
	@echo "Services started. Use 'make local-status' to check, 'make local-logs' to tail logs."

local-stop: ## Stop local services
	@echo "Stopping local services..."
	@if [ -f backend.pid ]; then kill $$(cat backend.pid) 2>/dev/null && rm backend.pid || true; fi
	@if [ -f frontend.pid ]; then kill $$(cat frontend.pid) 2>/dev/null && rm frontend.pid || true; fi
	@pkill -f "uvicorn.*app.main:app.*3001" || true
	@pkill -f "vite.*--host" || true
	@echo "Stopped."

local-restart: local-stop local-start ## Restart local services

local-logs: ## Tail local logs
	@tail -f backend/backend.log frontend/frontend.log

local-status: ## Show local process status
	@echo "--- Backend Process ---"
	@if [ -f backend.pid ]; then \
		pid=$$(cat backend.pid); \
		if ps -p $$pid > /dev/null; then echo "Running (PID: $$pid)"; else echo "Stopped (stale PID file)"; fi; \
	else \
		echo "Not running"; \
	fi
	@echo "--- Frontend Process ---"
	@if [ -f frontend.pid ]; then \
		pid=$$(cat frontend.pid); \
		if ps -p $$pid > /dev/null; then echo "Running (PID: $$pid)"; else echo "Stopped (stale PID file)"; fi; \
	else \
		echo "Not running"; \
	fi

