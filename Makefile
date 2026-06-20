.PHONY: help docker-build docker-up docker-down docker-logs docker-clean docker-ps docker-shell-api docker-shell-ai docker-shell-db docker-restart docker-rebuild

help:
	@echo "SAES2 Docker Commands"
	@echo "====================="
	@echo ""
	@echo "Setup & Build:"
	@echo "  make docker-build          - Build all Docker images"
	@echo "  make docker-build-nocache  - Build images without cache"
	@echo ""
	@echo "Run:"
	@echo "  make docker-up             - Start all containers"
	@echo "  make docker-down           - Stop all containers"
	@echo "  make docker-restart        - Restart all containers"
	@echo "  make docker-ps             - Show running containers"
	@echo ""
	@echo "Development:"
	@echo "  make docker-logs           - Show logs from all services"
	@echo "  make docker-logs-api       - Show logs from API service"
	@echo "  make docker-logs-ai        - Show logs from AI service"
	@echo "  make docker-logs-web       - Show logs from Web service"
	@echo "  make docker-logs-db        - Show logs from Database"
	@echo ""
	@echo "Access:"
	@echo "  make docker-shell-api      - Open shell in API container"
	@echo "  make docker-shell-ai       - Open shell in AI container"
	@echo "  make docker-shell-db       - Access MySQL in DB container"
	@echo "  make docker-shell-web      - Open shell in Web container"
	@echo ""
	@echo "Maintenance:"
	@echo "  make docker-clean          - Stop & remove containers, volumes, networks"
	@echo "  make docker-rebuild        - Clean & rebuild everything"
	@echo "  make docker-prune          - Remove unused Docker images and volumes"
	@echo ""

# Setup environment file if it doesn't exist
.env:
	@echo "Creating .env file from .env.docker..."
	@cp .env.docker .env
	@echo ".env file created. Please update with your credentials."

docker-build: .env
	docker-compose build

docker-build-nocache: .env
	docker-compose build --no-cache

docker-up: .env
	docker-compose up -d
	@echo ""
	@echo "✓ All services are starting..."
	@echo ""
	@echo "Services:"
	@echo "  Web:      http://localhost"
	@echo "  API:      http://localhost:3000"
	@echo "  AI:       http://localhost:8000"
	@echo "  Database: localhost:3306"
	@echo ""
	@echo "Run 'make docker-logs' to see logs"

docker-down:
	docker-compose down

docker-ps:
	docker-compose ps

docker-logs:
	docker-compose logs -f

docker-logs-api:
	docker-compose logs -f api

docker-logs-ai:
	docker-compose logs -f ai

docker-logs-web:
	docker-compose logs -f web

docker-logs-db:
	docker-compose logs -f db

docker-restart:
	docker-compose restart

docker-shell-api:
	docker-compose exec api sh

docker-shell-ai:
	docker-compose exec ai bash

docker-shell-db:
	docker-compose exec db mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME}

docker-shell-web:
	docker-compose exec web sh

docker-clean:
	docker-compose down -v --remove-orphans
	@echo "✓ Containers, volumes, and networks removed"

docker-rebuild: docker-clean docker-build docker-up
	@echo "✓ Full rebuild complete"

docker-prune:
	docker system prune -a --volumes
	@echo "✓ Unused images and volumes removed"

# Database commands
db-schema:
	docker-compose exec api npm run db:schema

db-seed:
	docker-compose exec api npm run db:seed

db-init: db-schema db-seed
	@echo "✓ Database initialized"

# Development helpers
dev-logs:
	docker-compose logs -f api web ai

install-deps:
	docker-compose exec api npm ci
	docker-compose exec web npm ci
