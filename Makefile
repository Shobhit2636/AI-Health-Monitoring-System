.PHONY: help up down logs shell-backend shell-frontend migrate test train clean

# Colors
GREEN  = \033[0;32m
BLUE   = \033[0;34m
YELLOW = \033[1;33m
NC     = \033[0m

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(BLUE)%-20s$(NC) %s\n", $$1, $$2}'

# ─── Docker ──────────────────────────────────────────────────
up: ## Start all services
	@echo "$(GREEN)Starting AI Health Ecosystem...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Running at http://localhost:3000$(NC)"

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs (all services)
	docker-compose logs -f

logs-backend: ## Show backend logs only
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs only
	docker-compose logs -f frontend

# ─── Database ────────────────────────────────────────────────
migrate: ## Run Alembic migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	docker-compose exec backend alembic upgrade head

migrate-rollback: ## Rollback last migration
	docker-compose exec backend alembic downgrade -1

migration-new: ## Create new migration (usage: make migration-new MSG="add table")
	docker-compose exec backend alembic revision --autogenerate -m "$(MSG)"

# ─── Testing ─────────────────────────────────────────────────
test: ## Run all backend tests
	@echo "$(BLUE)Running tests...$(NC)"
	cd backend && pytest tests/ -v

test-coverage: ## Run tests with coverage report
	cd backend && pytest tests/ --cov=app --cov-report=html --cov-report=term-missing

test-ai: ## Run AI service tests only
	cd backend && pytest tests/test_ai_services.py -v

# ─── AI Models ───────────────────────────────────────────────
train: ## Train AI models
	@echo "$(BLUE)Training XGBoost models...$(NC)"
	cd ai-services && python training/train_models.py
	@echo "$(GREEN)✅ Models saved to ai-services/models/$(NC)"

# ─── Dev shortcuts ───────────────────────────────────────────
dev-backend: ## Start backend in dev mode (local)
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Start frontend in dev mode (local)
	cd frontend && npm run dev

install-backend: ## Install backend dependencies
	cd backend && pip install -r requirements.txt

install-frontend: ## Install frontend dependencies
	cd frontend && npm install

shell-backend: ## Open shell in backend container
	docker-compose exec backend bash

shell-db: ## Open psql shell
	docker-compose exec postgres psql -U health_user -d health_db

# ─── Cleanup ─────────────────────────────────────────────────
clean: ## Remove containers, volumes, orphans
	@echo "$(YELLOW)⚠️  This will delete all data!$(NC)"
	docker-compose down -v --remove-orphans

clean-cache: ## Clear Redis cache
	docker-compose exec redis redis-cli -a redispass123 FLUSHALL

# ─── Production ──────────────────────────────────────────────
build: ## Build Docker images
	docker-compose build

push: ## Push Docker images to registry
	docker-compose push

deploy: ## Deploy to production (requires SSH setup)
	@echo "$(BLUE)Deploying to production...$(NC)"
	git push origin main
