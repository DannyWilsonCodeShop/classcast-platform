#!/bin/bash

# DemoProject Configuration Switcher
# Switches between regular and Turbopack configurations

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

# Function to switch to regular configuration
switch_to_regular() {
    print_status "Switching to regular Next.js configuration..."
    
    if [ -f "next.config.ts" ]; then
        cp next.config.ts next.config.regular.ts
        print_status "Backed up current config as next.config.regular.ts"
    fi
    
    if [ -f "next.config.regular.ts" ]; then
        cp next.config.regular.ts next.config.ts
        print_success "Configuration switched to regular mode."
        echo "Use: npm run dev"
    else
        print_error "Regular configuration file not found!"
        exit 1
    fi
}

# Function to switch to Turbopack configuration
switch_to_turbopack() {
    print_status "Switching to Turbopack-compatible configuration..."
    
    if [ -f "next.config.turbopack.ts" ]; then
        cp next.config.turbopack.ts next.config.ts
        print_success "Configuration switched to Turbopack mode."
        echo "Use: npm run dev:turbo"
    else
        print_error "Turbopack configuration file not found!"
        exit 1
    fi
}

# Function to show configuration status
show_status() {
    print_status "Current configuration status:"
    echo ""
    
    if [ -f "next.config.ts" ]; then
        echo "Main config: next.config.ts"
        echo "Type: Regular Next.js (compatible with both modes)"
    else
        echo "Main config: NOT FOUND"
    fi
    
    echo ""
    
    if [ -f "next.config.turbopack.ts" ]; then
        echo "Turbopack config: next.config.turbopack.ts"
    else
        echo "Turbopack config: NOT FOUND"
    fi
    
    if [ -f "next.config.regular.ts" ]; then
        echo "Regular config backup: next.config.regular.ts"
    fi
}

# Function to show help
show_help() {
    echo "DemoProject Configuration Switcher"
    echo "================================="
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  regular     Switch to regular Next.js configuration"
    echo "  turbopack   Switch to Turbopack-compatible configuration"
    echo "  status      Show current configuration status"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 regular     # Use regular Next.js"
    echo "  $0 turbopack   # Use Turbopack"
    echo "  $0 status      # Check current config"
}

# Main script logic
case "${1:-help}" in
    "regular")
        switch_to_regular
        ;;
    "turbopack")
        switch_to_turbopack
        ;;
    "status")
        show_status
        ;;
    "help"|*)
        show_help
        ;;
esac
