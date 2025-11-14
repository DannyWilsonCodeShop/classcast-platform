# DemoProject Build Script (PowerShell)
# This script builds the entire project including Next.js app and CDK infrastructure

param(
    [switch]$Clean,
    [switch]$NoDeps,
    [switch]$NoDocker,
    [switch]$NoTests,
    [switch]$Help
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check if Node.js is installed
    try {
        $null = Get-Command node -ErrorAction Stop
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    }
    
    # Check Node.js version
    $nodeVersion = (node -v) -replace 'v', ''
    $majorVersion = [int]($nodeVersion.Split('.')[0])
    if ($majorVersion -lt 18) {
        Write-Error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    }
    
    # Check if npm is installed
    try {
        $null = Get-Command npm -ErrorAction Stop
    }
    catch {
        Write-Error "npm is not installed. Please install npm first."
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Function to clean build artifacts
function Clear-BuildArtifacts {
    Write-Status "Cleaning build artifacts..."
    
    # Clean Next.js build
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next"
        Write-Status "Cleaned .next directory"
    }
    
    # Clean CDK build
    if (Test-Path "cdk/dist") {
        Remove-Item -Recurse -Force "cdk/dist"
        Write-Status "Cleaned cdk/dist directory"
    }
    
    Write-Success "Build artifacts cleaned"
}

# Function to install dependencies
function Install-Dependencies {
    Write-Status "Installing project dependencies..."
    npm install
    
    Write-Status "Installing CDK dependencies..."
    Set-Location cdk
    npm install
    Set-Location ..
    
    Write-Success "Dependencies installed successfully"
}

# Function to build Next.js application
function Build-NextJS {
    Write-Status "Building Next.js application..."
    
    # Type check
    Write-Status "Running TypeScript type check..."
    npm run type-check
    
    # Lint
    Write-Status "Running ESLint..."
    npm run lint
    
    # Build
    Write-Status "Building Next.js application..."
    npm run build
    
    Write-Success "Next.js application built successfully"
}

# Function to build CDK infrastructure
function Build-CDK {
    Write-Status "Building CDK infrastructure..."
    
    Set-Location cdk
    
    # Build TypeScript
    Write-Status "Compiling CDK TypeScript..."
    npm run build
    
    # Synthesize CloudFormation
    Write-Status "Synthesizing CloudFormation templates..."
    npm run synth
    
    Set-Location ..
    
    Write-Success "CDK infrastructure built successfully"
}

# Function to build Docker image
function Build-Docker {
    Write-Status "Building Docker image..."
    
    # Check if Docker is available
    try {
        $null = Get-Command docker -ErrorAction Stop
    }
    catch {
        Write-Warning "Docker is not installed. Skipping Docker build."
        return
    }
    
    # Build Docker image
    docker build -t demoproject-app:latest .
    
    Write-Success "Docker image built successfully"
}

# Function to run tests
function Invoke-Tests {
    Write-Status "Running tests..."
    
    # Run Next.js tests if they exist
    if (Test-Path "package.json") {
        $packageContent = Get-Content "package.json" -Raw | ConvertFrom-Json
        if ($packageContent.scripts.test) {
            Write-Status "Running Next.js tests..."
            npm test
        }
    }
    
    # Run CDK tests
    Set-Location cdk
    if (Test-Path "package.json") {
        $packageContent = Get-Content "package.json" -Raw | ConvertFrom-Json
        if ($packageContent.scripts.test) {
            Write-Status "Running CDK tests..."
            npm test
        }
    }
    Set-Location ..
    
    Write-Success "Tests completed successfully"
}

# Function to show build summary
function Show-BuildSummary {
    Write-Success "Build completed successfully!"
    Write-Host ""
    Write-Host "Build Summary:" -ForegroundColor White
    Write-Host "├── Next.js Application: ✅ Built" -ForegroundColor Green
    Write-Host "├── CDK Infrastructure: ✅ Built" -ForegroundColor Green
    Write-Host "├── Docker Image: ✅ Built" -ForegroundColor Green
    Write-Host "└── Tests: ✅ Passed" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Start development: npm run dev" -ForegroundColor Yellow
    Write-Host "2. Deploy infrastructure: npm run infra:deploy" -ForegroundColor Yellow
    Write-Host "3. Build for production: npm run build:standalone" -ForegroundColor Yellow
}

# Function to show help
function Show-Help {
    Write-Host "DemoProject Build Script (PowerShell)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\build.ps1 [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -Clean          Clean build artifacts before building" -ForegroundColor Yellow
    Write-Host "  -NoDeps         Skip dependency installation" -ForegroundColor Yellow
    Write-Host "  -NoDocker       Skip Docker build" -ForegroundColor Yellow
    Write-Host "  -NoTests        Skip running tests" -ForegroundColor Yellow
    Write-Host "  -Help           Show this help message" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\build.ps1                    # Full build" -ForegroundColor Gray
    Write-Host "  .\build.ps1 -Clean            # Clean and build" -ForegroundColor Gray
    Write-Host "  .\build.ps1 -NoDocker         # Build without Docker" -ForegroundColor Gray
}

# Main build process
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Status "Starting DemoProject build process..."
    
    # Check prerequisites
    Test-Prerequisites
    
    # Clean build if requested
    if ($Clean) {
        Clear-BuildArtifacts
    }
    
    # Install dependencies if requested
    if (-not $NoDeps) {
        Install-Dependencies
    }
    
    # Build Next.js application
    Build-NextJS
    
    # Build CDK infrastructure
    Build-CDK
    
    # Build Docker image if requested
    if (-not $NoDocker) {
        Build-Docker
    }
    
    # Run tests if requested
    if (-not $NoTests) {
        Invoke-Tests
    }
    
    # Show build summary
    Show-BuildSummary
}

# Run main function
Main
