#!/bin/bash

# DemoProject CDK Deployment Script
# This script provides easy deployment commands for the infrastructure

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
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Check if CDK is installed
    if ! command -v cdk &> /dev/null; then
        print_error "AWS CDK is not installed. Please install it first: npm install -g aws-cdk"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to build the project
build_project() {
    print_status "Building the project..."
    npm run build
    print_success "Project built successfully"
}

# Function to bootstrap CDK (if needed)
bootstrap_cdk() {
    print_status "Checking if CDK is bootstrapped..."
    if ! aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
        print_warning "CDK is not bootstrapped. Bootstrapping now..."
        cdk bootstrap
        print_success "CDK bootstrapped successfully"
    else
        print_success "CDK is already bootstrapped"
    fi
}

# Function to deploy all stacks
deploy_all() {
    print_status "Deploying all stacks..."
    cdk deploy --all --require-approval never
    print_success "All stacks deployed successfully"
}

# Function to deploy specific stack
deploy_stack() {
    local stack_name=$1
    if [ -z "$stack_name" ]; then
        print_error "Stack name is required"
        exit 1
    fi
    
    print_status "Deploying stack: $stack_name"
    cdk deploy "$stack_name" --require-approval never
    print_success "Stack $stack_name deployed successfully"
}

# Function to destroy all stacks
destroy_all() {
    print_warning "This will destroy ALL infrastructure. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Destroying all stacks..."
        cdk destroy --all --force
        print_success "All stacks destroyed successfully"
    else
        print_status "Operation cancelled"
    fi
}

# Function to show stack status
show_status() {
    print_status "Current stack status:"
    cdk list
}

# Function to show stack differences
show_diff() {
    print_status "Showing stack differences..."
    cdk diff
}

# Function to show stack outputs
show_outputs() {
    print_status "Stack outputs:"
    cdk list-exports
}

# Function to show help
show_help() {
    echo "DemoProject CDK Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy-all     Deploy all infrastructure stacks"
    echo "  deploy-stack   Deploy a specific stack (requires stack name)"
    echo "  destroy-all    Destroy all infrastructure stacks"
    echo "  status         Show current stack status"
    echo "  diff           Show stack differences"
    echo "  outputs        Show stack outputs"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy-all"
    echo "  $0 deploy-stack DemoProject-NetworkStack"
    echo "  $0 status"
}

# Main script logic
main() {
    case "${1:-help}" in
        "deploy-all")
            check_prerequisites
            build_project
            bootstrap_cdk
            deploy_all
            ;;
        "deploy-stack")
            check_prerequisites
            build_project
            bootstrap_cdk
            deploy_stack "$2"
            ;;
        "destroy-all")
            check_prerequisites
            destroy_all
            ;;
        "status")
            check_prerequisites
            show_status
            ;;
        "diff")
            check_prerequisites
            build_project
            show_diff
            ;;
        "outputs")
            check_prerequisites
            show_outputs
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
