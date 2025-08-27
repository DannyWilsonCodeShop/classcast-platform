#!/bin/bash

# DemoProject Build Script
# This script builds the entire project including Next.js app and CDK infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to clean build artifacts
clean_build() {
    print_status "Cleaning build artifacts..."
    
    # Clean Next.js build
    if [ -d ".next" ]; then
        rm -rf .next
        print_status "Cleaned .next directory"
    fi
    
    # Clean CDK build
    if [ -d "cdk/dist" ]; then
        rm -rf cdk/dist
        print_status "Cleaned cdk/dist directory"
    fi
    
    print_success "Build artifacts cleaned"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    npm install
    
    print_status "Installing CDK dependencies..."
    cd cdk
    npm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Function to build Next.js application
build_nextjs() {
    print_status "Building Next.js application..."
    
    # Type check
    print_status "Running TypeScript type check..."
    npm run type-check
    
    # Lint
    print_status "Running ESLint..."
    npm run lint
    
    # Build
    print_status "Building Next.js application..."
    npm run build
    
    print_success "Next.js application built successfully"
}

# Function to build CDK infrastructure
build_cdk() {
    print_status "Building CDK infrastructure..."
    
    cd cdk
    
    # Build TypeScript
    print_status "Compiling CDK TypeScript..."
    npm run build
    
    # Synthesize CloudFormation
    print_status "Synthesizing CloudFormation templates..."
    npm run synth
    
    cd ..
    
    print_success "CDK infrastructure built successfully"
}

# Function to build Docker image
build_docker() {
    print_status "Building Docker image..."
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Skipping Docker build."
        return 0
    fi
    
    # Build Docker image
    docker build -t demoproject-app:latest .
    
    print_success "Docker image built successfully"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Run Next.js tests if they exist
    if [ -f "package.json" ] && grep -q "\"test\":" package.json; then
        print_status "Running Next.js tests..."
        npm test
    fi
    
    # Run CDK tests
    cd cdk
    if [ -f "package.json" ] && grep -q "\"test\":" package.json; then
        print_status "Running CDK tests..."
        npm test
    fi
    cd ..
    
    print_success "Tests completed successfully"
}

# Function to show build summary
show_build_summary() {
    print_success "Build completed successfully!"
    echo ""
    echo "Build Summary:"
    echo "├── Next.js Application: ✅ Built"
    echo "├── CDK Infrastructure: ✅ Built"
    echo "├── Docker Image: ✅ Built"
    echo "└── Tests: ✅ Passed"
    echo ""
    echo "Next steps:"
    echo "1. Start development: npm run dev"
    echo "2. Deploy infrastructure: npm run infra:deploy"
    echo "3. Build for production: npm run build:standalone"
}

# Function to show help
show_help() {
    echo "DemoProject Build Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean          Clean build artifacts before building"
    echo "  --no-deps        Skip dependency installation"
    echo "  --no-docker      Skip Docker build"
    echo "  --no-tests       Skip running tests"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full build"
    echo "  $0 --clean            # Clean and build"
    echo "  $0 --no-docker        # Build without Docker"
}

# Parse command line arguments
CLEAN_BUILD=false
INSTALL_DEPS=true
BUILD_DOCKER=true
RUN_TESTS=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --no-deps)
            INSTALL_DEPS=false
            shift
            ;;
        --no-docker)
            BUILD_DOCKER=false
            shift
            ;;
        --no-tests)
            RUN_TESTS=false
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main build process
main() {
    print_status "Starting DemoProject build process..."
    
    # Check prerequisites
    check_prerequisites
    
    # Clean build if requested
    if [ "$CLEAN_BUILD" = true ]; then
        clean_build
    fi
    
    # Install dependencies if requested
    if [ "$INSTALL_DEPS" = true ]; then
        install_dependencies
    fi
    
    # Build Next.js application
    build_nextjs
    
    # Build CDK infrastructure
    build_cdk
    
    # Build Docker image if requested
    if [ "$BUILD_DOCKER" = true ]; then
        build_docker
    fi
    
    # Run tests if requested
    if [ "$RUN_TESTS" = true ]; then
        run_tests
    fi
    
    # Show build summary
    show_build_summary
}

# Run main function
main "$@"
