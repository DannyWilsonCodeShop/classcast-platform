# DemoProject Makefile
# Provides easy access to common development and deployment commands

.PHONY: help install dev build clean docker infra-deploy infra-destroy

# Default target
help:
	@echo "DemoProject - Available Commands"
	@echo "================================="
	@echo ""
	@echo "Development:"
	@echo "  make install        Install all dependencies"
	@echo "  make dev            Start development server"
	@echo "  make dev-turbo     Start development server with Turbopack"
	@echo "  make build         Build Next.js application"
	@echo "  make clean         Clean build artifacts"
	@echo "  make type-check    Run TypeScript type checking"
	@echo "  make lint          Run ESLint"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build  Build Docker image"
	@echo "  make docker-run    Run Docker container locally"
	@echo ""
	@echo "Infrastructure:"
	@echo "  make infra-build   Build CDK infrastructure"
	@echo "  make infra-deploy  Deploy all infrastructure"
	@echo "  make infra-destroy Destroy all infrastructure"
	@echo "  make infra-status  Show infrastructure status"
	@echo ""
	@echo "Full Workflow:"
	@echo "  make workflow      Run complete development workflow"
	@echo "  make deploy        Build and deploy everything"

# Install dependencies
install:
	@echo "Installing project dependencies..."
	npm install
	@echo "Installing CDK dependencies..."
	cd cdk && npm install
	@echo "Dependencies installed successfully!"

# Development server
dev:
	@echo "Starting development server..."
	npm run dev

dev-turbo:
	@echo "Starting development server with Turbopack..."
	npm run dev:turbo

# Build commands
build:
	@echo "Building Next.js application..."
	npm run build

build-standalone:
	@echo "Building standalone Next.js application..."
	npm run build:standalone

# Clean commands
clean:
	@echo "Cleaning build artifacts..."
	if exist .next rmdir /s .next
	if exist out rmdir /s out
	if exist dist rmdir /s dist
	cd cdk && if exist dist rmdir /s dist
	@echo "Build artifacts cleaned!"

# Code quality
type-check:
	@echo "Running TypeScript type check..."
	npm run type-check

lint:
	@echo "Running ESLint..."
	npm run lint

lint-fix:
	@echo "Running ESLint with auto-fix..."
	npm run lint:fix

# Docker commands
docker-build:
	@echo "Building Docker image..."
	docker build -t demoproject-app:latest .

docker-run:
	@echo "Running Docker container..."
	docker run -p 3000:3000 demoproject-app:latest

# Infrastructure commands
infra-build:
	@echo "Building CDK infrastructure..."
	cd cdk && npm run build

infra-synth:
	@echo "Synthesizing CloudFormation templates..."
	cd cdk && npm run synth

infra-deploy:
	@echo "Deploying all infrastructure..."
	cd cdk && npm run deploy:all

infra-deploy-network:
	@echo "Deploying network infrastructure..."
	cd cdk && npm run deploy:network

infra-deploy-database:
	@echo "Deploying database infrastructure..."
	cd cdk && npm run deploy:database

infra-deploy-application:
	@echo "Deploying application infrastructure..."
	cd cdk && npm run deploy:application

infra-destroy:
	@echo "Destroying all infrastructure..."
	cd cdk && npm run destroy:all

infra-status:
	@echo "Showing infrastructure status..."
	cd cdk && npm run status

infra-diff:
	@echo "Showing infrastructure differences..."
	cd cdk && npm run diff

# Full workflow
workflow: install type-check lint build docker-build infra-build
	@echo "Full development workflow completed!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Start development: make dev"
	@echo "2. Deploy infrastructure: make infra-deploy"

deploy: workflow infra-deploy
	@echo "Complete deployment completed!"

# Test commands
test:
	@echo "Running tests..."
	npm test
	cd cdk && npm test

# Watch commands
watch:
	@echo "Watching for changes..."
	cd cdk && npm run watch

# Bootstrap CDK (first time only)
bootstrap:
	@echo "Bootstrapping CDK..."
	cd cdk && npm run bootstrap
