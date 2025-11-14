#!/bin/bash

# DemoProject Authentication Lambda Functions Test Runner
# This script provides easy access to different testing scenarios

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

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ to run tests."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_warning "Node.js version $(node --version) detected. Version 18+ is recommended."
    else
        print_success "Node.js $(node --version) detected."
    fi
}

# Function to check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm to run tests."
        exit 1
    fi
    print_success "npm $(npm --version) detected."
}

# Function to install dependencies
install_deps() {
    print_status "Installing dependencies..."
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Dependencies installed successfully."
    else
        print_status "Dependencies already installed."
    fi
}

# Function to run tests
run_tests() {
    local test_type="$1"
    
    case $test_type in
        "all")
            print_status "Running all tests..."
            npm test
            ;;
        "watch")
            print_status "Running tests in watch mode..."
            npm run test:watch
            ;;
        "coverage")
            print_status "Running tests with coverage report..."
            npm run test:coverage
            ;;
        "verbose")
            print_status "Running tests with verbose output..."
            npm run test:verbose
            ;;
        "unit")
            print_status "Running unit tests only..."
            npm run test:unit
            ;;
        "debug")
            print_status "Running tests in debug mode..."
            npm run test:debug
            ;;
        "clean")
            print_status "Cleaning test artifacts..."
            npm run clean
            print_success "Cleanup completed."
            ;;
        "build")
            print_status "Building TypeScript..."
            npm run build
            print_success "Build completed."
            ;;
        "lint")
            print_status "Running linting..."
            npm run lint
            print_success "Linting completed."
            ;;
        "lint:fix")
            print_status "Running linting with auto-fix..."
            npm run lint:fix
            print_success "Linting with auto-fix completed."
            ;;
        *)
            print_error "Unknown test type: $test_type"
            show_usage
            exit 1
            ;;
    esac
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  all         Run all tests"
    echo "  watch       Run tests in watch mode (recommended for development)"
    echo "  coverage    Run tests with coverage report"
    echo "  verbose     Run tests with verbose output"
    echo "  unit        Run unit tests only"
    echo "  debug       Run tests in debug mode"
    echo "  clean       Clean test artifacts and dependencies"
    echo "  build       Build TypeScript code"
    echo "  lint        Run ESLint"
    echo "  lint:fix    Run ESLint with auto-fix"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 all           # Run all tests"
    echo "  $0 watch         # Run tests in watch mode"
    echo "  $0 coverage      # Run tests with coverage"
    echo "  $0 clean         # Clean up before fresh install"
}

# Function to show test status
show_status() {
    print_status "Test Environment Status:"
    echo "  Node.js: $(node --version)"
    echo "  npm: $(npm --version)"
    echo "  TypeScript: $(npx tsc --version)"
    echo "  Jest: $(npx jest --version)"
    echo ""
    
    if [ -d "node_modules" ]; then
        print_success "Dependencies: Installed"
    else
        print_warning "Dependencies: Not installed"
    fi
    
    if [ -d "dist" ]; then
        print_success "Build: Compiled"
    else
        print_warning "Build: Not compiled"
    fi
    
    if [ -d "coverage" ]; then
        print_success "Coverage: Available"
    else
        print_warning "Coverage: Not available"
    fi
}

# Main execution
main() {
    local test_type="$1"
    
    # Show banner
    echo "=========================================="
    echo "  DemoProject Authentication Tests"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_node
    check_npm
    
    # Change to script directory
    cd "$(dirname "$0")"
    
    # Handle help
    if [ "$test_type" = "help" ] || [ "$test_type" = "--help" ] || [ "$test_type" = "-h" ]; then
        show_usage
        exit 0
    fi
    
    # Handle status
    if [ "$test_type" = "status" ]; then
        show_status
        exit 0
    fi
    
    # Install dependencies if needed
    install_deps
    
    # Run tests
    if [ -n "$test_type" ]; then
        run_tests "$test_type"
    else
        print_status "No test type specified. Running all tests..."
        run_tests "all"
    fi
}

# Run main function with all arguments
main "$@"
