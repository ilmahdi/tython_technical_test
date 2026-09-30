# Configurations
.DEFAULT_GOAL := help

# Variables for Docker Compose commands and service names
DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_FILE = docker-compose.yml

# Service names
FRONT_SERVICE = app-front
BACK_SERVICE = app-back

# Targets (phony targets are not actual files)
.PHONY: build up up-build up-build-front up-build-back down restart logs \
        logs-front logs-back sh-front sh-back clean prune help \
        test-back lint-front build-front

# Ensure local environment files exist from templates if missing
setup-env:
	@if [ ! -f back/.env ] && [ -f back/.env.example ]; then cp back/.env.example back/.env; echo "Created back/.env from template"; fi
	@if [ ! -f front/.env ] && [ -f front/.env.example ]; then cp front/.env.example front/.env; echo "Created front/.env from template"; fi

# Build all services defined in the docker-compose.yml file
build: setup-env
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build

# Start all services without rebuilding them in dev mode
up: setup-env
	DEV_MODE_APP=true $(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d

# Start all services without rebuilding them in prod mode
up-prod: setup-env
	BUILD_FRONT_APP=false BUILD_BACK_APP=false $(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d

# Start all services with rebuild options (rebuild front-end and back-end)
up-build-prod: setup-env
	BUILD_FRONT_APP=true BUILD_BACK_APP=true $(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d

# Stop all services and remove the associated containers
down:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

# Restart all services by first stopping and then starting them again
restart: down up

# Show logs from all services
logs:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs -f

# Show logs from the front-end service
logs-front:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs -f $(FRONT_SERVICE)

# Show logs from the back-end service
logs-back:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs -f $(BACK_SERVICE)

# Access the front-end service container's shell
sh-front:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec $(FRONT_SERVICE) /bin/sh

# Access the back-end service container's shell
sh-back:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec $(BACK_SERVICE) /bin/sh

# Run backend tests inside the container
test-back:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec $(BACK_SERVICE) npm test

# Run frontend linting inside the container
lint-front:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec $(FRONT_SERVICE) npm run lint

# Run frontend build inside the container
build-front:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec $(FRONT_SERVICE) npm run build

# Remove containers, networks, and volumes, cleaning up the environment
clean:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down -v

# Remove unused Docker data, including stopped containers and unneeded images
prune:
	docker system prune -af --volumes

# Display help documentation with available Makefile commands
help:
	@echo "Makefile for managing the application"
	@echo ""
	@echo "Usage:"
	@echo "  make build             Build all services"
	@echo "  make up                Start all services in development mode"
	@echo "  make up-prod           Start all services in production mode without rebuilding"
	@echo "  make up-build-prod     Rebuild and start all services in production mode"
	@echo "  make down              Stop all services and remove containers"
	@echo "  make restart           Restart all services by stopping and starting them"
	@echo "  make logs              View logs from all services"
	@echo "  make logs-front        View logs from the front-end service"
	@echo "  make logs-back         View logs from the back-end service"
	@echo "  make sh-front          Access the front-end container shell"
	@echo "  make sh-back           Access the back-end container shell"
	@echo "  make test-back         Run backend tests inside container"
	@echo "  make lint-front        Run frontend linter inside container"
	@echo "  make build-front       Run frontend build inside container"
	@echo "  make clean             Remove containers, networks, and volumes"
	@echo "  make prune             Remove unused Docker data, including stopped containers"
