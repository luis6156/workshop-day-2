.PHONY: help install build up down logs clean test

# Colors for terminal output
BLUE=\033[0;34m
GREEN=\033[0;32m
RED=\033[0;31m
NC=\033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install dependencies for both backend and frontend
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd backend && npm install
	@echo "$(GREEN)✓ Backend dependencies installed$(NC)"
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose build
	@echo "$(GREEN)✓ Docker images built$(NC)"

up: ## Start all services with docker-compose
	@echo "$(BLUE)Starting services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Services started$(NC)"
	@echo "$(BLUE)Access the application at:$(NC)"
	@echo "  Frontend:  http://localhost:3000"
	@echo "  Backend:   http://localhost:3001"
	@echo "  Grafana:   http://localhost:3002 (admin/admin)"

down: ## Stop all services
	@echo "$(BLUE)Stopping services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

logs-grafana: ## Show Grafana logs
	docker-compose logs -f grafana

restart: ## Restart all services
	@echo "$(BLUE)Restarting services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✓ Services restarted$(NC)"

ps: ## Show running containers
	docker-compose ps

clean: ## Clean up containers, volumes, and images
	@echo "$(RED)Cleaning up...$(NC)"
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

dev-backend: ## Run backend in development mode
	cd backend && npm run dev

dev-frontend: ## Run frontend in development mode
	cd frontend && npm run dev

test: ## Run tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd backend && npm test
	@echo "$(GREEN)✓ Backend tests passed$(NC)"

# Kubernetes commands
k8s-apply: ## Apply Kubernetes manifests
	@echo "$(BLUE)Applying Kubernetes manifests...$(NC)"
	kubectl apply -f k8s/
	@echo "$(GREEN)✓ Kubernetes resources applied$(NC)"

k8s-delete: ## Delete Kubernetes resources
	@echo "$(RED)Deleting Kubernetes resources...$(NC)"
	kubectl delete -f k8s/
	@echo "$(GREEN)✓ Kubernetes resources deleted$(NC)"

k8s-status: ## Show Kubernetes resources status
	kubectl get all -n demo-app

k8s-logs-backend: ## Show backend logs from Kubernetes
	kubectl logs -f deployment/backend -n demo-app

k8s-logs-frontend: ## Show frontend logs from Kubernetes
	kubectl logs -f deployment/frontend -n demo-app

# Terraform commands
tf-init: ## Initialize Terraform
	cd terraform && terraform init

tf-plan: ## Run Terraform plan
	cd terraform && terraform plan

tf-apply: ## Apply Terraform changes
	cd terraform && terraform apply

tf-destroy: ## Destroy Terraform infrastructure
	cd terraform && terraform destroy

# Development helpers
create-notification: ## Create a test notification
	curl -X POST http://localhost:3001/api/notifications \
		-H "Content-Type: application/json" \
		-d '{"message":"Test notification from Makefile","type":"info"}'

health-check: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@curl -s http://localhost:3001/api/health | jq . || echo "$(RED)Backend not responding$(NC)"
	@curl -s http://localhost:3000 > /dev/null && echo "$(GREEN)✓ Frontend is up$(NC)" || echo "$(RED)✗ Frontend is down$(NC)"
	@curl -s http://localhost:3002/api/health > /dev/null && echo "$(GREEN)✓ Grafana is up$(NC)" || echo "$(RED)✗ Grafana is down$(NC)"

metrics: ## Show Prometheus metrics
	curl http://localhost:3001/metrics

redis-cli: ## Connect to Redis CLI
	docker-compose exec redis redis-cli

.DEFAULT_GOAL := help
