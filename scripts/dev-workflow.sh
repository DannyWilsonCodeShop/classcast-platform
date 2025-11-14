#!/bin/bash

# DemoProject Development Workflow Script
# This script handles the complete development workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_deps=()
    
    # Check Node.js
    if ! command_exists node; then
        missing_deps+=("Node.js")
    else
        local node_version=$(node -v)
        print_success "Node.js: $node_version"
    fi
    
    # Check npm
    if ! command_exists npm; then
        missing_deps+=("npm")
    else
        local npm_version=$(npm -v)
        print_success "npm: $npm_version"
    fi
    
    # Check Docker (optional)
    if command_exists docker; then
        local docker_version=$(docker --version)
        print_success "Docker: $docker_version"
    else
        print_warning "Docker not found (optional for local development)"
    fi
    
    # Check AWS CLI (optional)
    if command_exists aws; then
        local aws_version=$(aws --version)
        print_success "AWS CLI: $aws_version"
    else
        print_warning "AWS CLI not found (required for infrastructure deployment)"
    fi
    
    # Check CDK (optional)
    if command_exists cdk; then
        local cdk_version=$(cdk --version)
        print_success "AWS CDK: $cdk_version"
    else
        print_warning "AWS CDK not found (required for infrastructure deployment)"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi
    
    print_success "All prerequisites satisfied!"
}

# Function to setup development environment
setup_dev_environment() {
    print_header "Setting Up Development Environment"
    
    # Install root dependencies
    print_status "Installing project dependencies..."
    npm install
    
    # Install CDK dependencies
    print_status "Installing CDK dependencies..."
    cd cdk
    npm install
    cd ..
    
    print_success "Development environment setup complete!"
}

# Function to start development server
start_dev_server() {
    print_header "Starting Development Server"
    
    local use_turbopack=${1:-false}
    
    if [ "$use_turbopack" = true ]; then
        print_status "Starting Next.js development server with Turbopack..."
        npm run dev:turbo
    else
        print_status "Starting Next.js development server..."
        npm run dev
    fi
}

# Function to run type checking
run_type_check() {
    print_header "Running TypeScript Type Check"
    
    print_status "Checking Next.js types..."
    npm run type-check
    
    print_status "Checking CDK types..."
    cd cdk
    npm run build
    cd ..
    
    print_success "Type checking completed successfully!"
}

# Function to run linting
run_linting() {
    print_header "Running Code Quality Checks"
    
    print_status "Running ESLint..."
    npm run lint
    
    print_success "Linting completed successfully!"
}

# Function to run tests
run_tests() {
    print_header "Running Tests"
    
    # Check if tests exist and run them
    if grep -q "\"test\":" package.json; then
        print_status "Running Next.js tests..."
        npm test
    else
        print_warning "No tests configured for Next.js application"
    fi
    
    cd cdk
    if grep -q "\"test\":" package.json; then
        print_status "Running CDK tests..."
        npm test
    else
        print_warning "No tests configured for CDK infrastructure"
    fi
    cd ..
    
    print_success "Testing completed successfully!"
}

# Function to build project
build_project() {
    print_header "Building Project"
    
    print_status "Building Next.js application..."
    npm run build
    
    print_status "Building CDK infrastructure..."
    cd cdk
    npm run build
    npm run synth
    cd ..
    
    print_success "Project built successfully!"
}

# Function to build Docker image
build_docker() {
    print_header "Building Docker Image"
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Cannot build Docker image."
        return 1
    fi
    
    print_status "Building Docker image..."
    docker build -t demoproject-app:latest .
    
    print_success "Docker image built successfully!"
}

# Function to show development menu
show_dev_menu() {
    clear
    print_header "DemoProject Development Menu"
    echo ""
    echo "1.  Setup development environment"
    echo "2.  Start development server (regular)"
    echo "3.  Start development server (Turbopack)"
    echo "4.  Run type checking"
    echo "5.  Run linting"
    echo "6.  Run tests"
    echo "7.  Build project"
    echo "8.  Build Docker image"
    echo "9.  Full development workflow"
    echo "10. Exit"
    echo ""
    read -p "Select an option (1-10): " choice
    
    case $choice in
        1) setup_dev_environment ;;
        2) start_dev_server false ;;
        3) start_dev_server true ;;
        4) run_type_check ;;
        5) run_linting ;;
        6) run_tests ;;
        7) build_project ;;
        8) build_docker ;;
        9) full_dev_workflow ;;
        10) print_success "Goodbye!"; exit 0 ;;
        *) print_error "Invalid option. Please try again." ;;
    esac
}

# Function to run full development workflow
full_dev_workflow() {
    print_header "Running Full Development Workflow"
    
    setup_dev_environment
    run_type_check
    run_linting
    run_tests
    build_project
    build_docker
    
    print_success "Full development workflow completed!"
    echo ""
    echo "Next steps:"
    echo "1. Start development: npm run dev"
    echo "2. Deploy infrastructure: npm run infra:deploy"
    echo "3. Push Docker image: npm run docker:push"
}

# Function to show help
show_help() {
    echo "DemoProject Development Workflow Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup           Setup development environment"
    echo "  dev             Start development server (regular)"
    echo "  dev:turbo       Start development server (Turbopack)"
    echo "  type-check      Run TypeScript type checking"
    echo "  lint            Run ESLint"
    echo "  test            Run tests"
    echo "  build           Build project"
    echo "  docker          Build Docker image"
    echo "  workflow        Run full development workflow"
    echo "  menu            Show interactive development menu"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup        # Setup development environment"
    echo "  $0 dev          # Start development server"
    echo "  $0 workflow     # Run full workflow"
}

# Main script logic
main() {
    case "${1:-menu}" in
        "setup")
            check_prerequisites
            setup_dev_environment
            ;;
        "dev")
            start_dev_server false
            ;;
        "dev:turbo")
            start_dev_server true
            ;;
        "type-check")
            run_type_check
            ;;
        "lint")
            run_linting
            ;;
        "test")
            run_tests
            ;;
        "build")
            build_project
            ;;
        "docker")
            build_docker
            ;;
        "workflow")
            check_prerequisites
            full_dev_workflow
            ;;
        "menu")
            while true; do
                show_dev_menu
                echo ""
                read -p "Press Enter to continue..."
            done
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
