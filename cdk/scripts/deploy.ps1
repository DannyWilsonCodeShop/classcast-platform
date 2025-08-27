# DemoProject CDK Deployment Script (PowerShell)
# This script provides easy deployment commands for the infrastructure

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$StackName = ""
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
    
    # Check if AWS CLI is installed
    try {
        $null = Get-Command aws -ErrorAction Stop
    }
    catch {
        Write-Error "AWS CLI is not installed. Please install it first."
        exit 1
    }
    
    # Check if AWS credentials are configured
    try {
        $null = aws sts get-caller-identity 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "AWS credentials not configured"
        }
    }
    catch {
        Write-Error "AWS credentials are not configured. Please run 'aws configure' first."
        exit 1
    }
    
    # Check if CDK is installed
    try {
        $null = Get-Command cdk -ErrorAction Stop
    }
    catch {
        Write-Error "AWS CDK is not installed. Please install it first: npm install -g aws-cdk"
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Function to build the project
function Build-Project {
    Write-Status "Building the project..."
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Project built successfully"
    } else {
        Write-Error "Project build failed"
        exit 1
    }
}

# Function to bootstrap CDK (if needed)
function Initialize-CDK {
    Write-Status "Checking if CDK is bootstrapped..."
    try {
        $null = aws cloudformation describe-stacks --stack-name CDKToolkit 2>$null
        Write-Success "CDK is already bootstrapped"
    }
    catch {
        Write-Warning "CDK is not bootstrapped. Bootstrapping now..."
        cdk bootstrap
        if ($LASTEXITCODE -eq 0) {
            Write-Success "CDK bootstrapped successfully"
        } else {
            Write-Error "CDK bootstrap failed"
            exit 1
        }
    }
}

# Function to deploy all stacks
function Deploy-AllStacks {
    Write-Status "Deploying all stacks..."
    cdk deploy --all --require-approval never
    if ($LASTEXITCODE -eq 0) {
        Write-Success "All stacks deployed successfully"
    } else {
        Write-Error "Deployment failed"
        exit 1
    }
}

# Function to deploy specific stack
function Deploy-Stack {
    param([string]$StackName)
    
    if ([string]::IsNullOrEmpty($StackName)) {
        Write-Error "Stack name is required"
        exit 1
    }
    
    Write-Status "Deploying stack: $StackName"
    cdk deploy $StackName --require-approval never
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Stack $StackName deployed successfully"
    } else {
        Write-Error "Stack deployment failed"
        exit 1
    }
}

# Function to destroy all stacks
function Remove-AllStacks {
    $response = Read-Host "This will destroy ALL infrastructure. Are you sure? (y/N)"
    if ($response -match "^([yY][eE][sS]|[yY])$") {
        Write-Status "Destroying all stacks..."
        cdk destroy --all --force
        if ($LASTEXITCODE -eq 0) {
            Write-Success "All stacks destroyed successfully"
        } else {
            Write-Error "Stack destruction failed"
            exit 1
        }
    } else {
        Write-Status "Operation cancelled"
    }
}

# Function to show stack status
function Show-StackStatus {
    Write-Status "Current stack status:"
    cdk list
}

# Function to show stack differences
function Show-StackDiff {
    Write-Status "Showing stack differences..."
    cdk diff
}

# Function to show stack outputs
function Show-StackOutputs {
    Write-Status "Stack outputs:"
    cdk list-exports
}

# Function to show help
function Show-Help {
    Write-Host "DemoProject CDK Deployment Script (PowerShell)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [COMMAND] [STACK_NAME]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  deploy-all     Deploy all infrastructure stacks" -ForegroundColor Yellow
    Write-Host "  deploy-stack   Deploy a specific stack (requires stack name)" -ForegroundColor Yellow
    Write-Host "  destroy-all    Destroy all infrastructure stacks" -ForegroundColor Yellow
    Write-Host "  status         Show current stack status" -ForegroundColor Yellow
    Write-Host "  diff           Show stack differences" -ForegroundColor Yellow
    Write-Host "  outputs        Show stack outputs" -ForegroundColor Yellow
    Write-Host "  help           Show this help message" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\deploy.ps1 deploy-all" -ForegroundColor Gray
    Write-Host "  .\deploy.ps1 deploy-stack DemoProject-NetworkStack" -ForegroundColor Gray
    Write-Host "  .\deploy.ps1 status" -ForegroundColor Gray
}

# Main script logic
function Main {
    switch ($Command.ToLower()) {
        "deploy-all" {
            Test-Prerequisites
            Build-Project
            Initialize-CDK
            Deploy-AllStacks
        }
        "deploy-stack" {
            Test-Prerequisites
            Build-Project
            Initialize-CDK
            Deploy-Stack $StackName
        }
        "destroy-all" {
            Test-Prerequisites
            Remove-AllStacks
        }
        "status" {
            Test-Prerequisites
            Show-StackStatus
        }
        "diff" {
            Test-Prerequisites
            Build-Project
            Show-StackDiff
        }
        "outputs" {
            Test-Prerequisites
            Show-StackOutputs
        }
        "help" {
            Show-Help
        }
        default {
            Write-Error "Unknown command: $Command"
            Show-Help
            exit 1
        }
    }
}

# Run main function
Main
