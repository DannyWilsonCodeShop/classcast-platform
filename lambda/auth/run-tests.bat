@echo off
REM DemoProject Authentication Lambda Functions Test Runner (Windows)
REM This script provides easy access to different testing scenarios

setlocal enabledelayedexpansion

REM Colors for output (Windows 10+ supports ANSI colors)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Function to print colored output
:print_status
echo %BLUE%[INFO]%NC% %~1
goto :eof

:print_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Function to check if Node.js is installed
:check_node
node --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Node.js is not installed. Please install Node.js 18+ to run tests."
    exit /b 1
)

for /f "tokens=2 delims=." %%i in ('node --version') do set NODE_VERSION=%%i
if !NODE_VERSION! LSS 18 (
    call :print_warning "Node.js version detected. Version 18+ is recommended."
) else (
    call :print_success "Node.js detected."
)
goto :eof

REM Function to check if npm is installed
:check_npm
npm --version >nul 2>&1
if errorlevel 1 (
    call :print_error "npm is not installed. Please install npm to run tests."
    exit /b 1
)
call :print_success "npm detected."
goto :eof

REM Function to install dependencies
:install_deps
call :print_status "Installing dependencies..."
if not exist "node_modules" (
    npm install
    call :print_success "Dependencies installed successfully."
) else (
    call :print_status "Dependencies already installed."
)
goto :eof

REM Function to run tests
:run_tests
set test_type=%~1

if "%test_type%"=="all" (
    call :print_status "Running all tests..."
    npm test
) else if "%test_type%"=="watch" (
    call :print_status "Running tests in watch mode..."
    npm run test:watch
) else if "%test_type%"=="coverage" (
    call :print_status "Running tests with coverage report..."
    npm run test:coverage
) else if "%test_type%"=="verbose" (
    call :print_status "Running tests with verbose output..."
    npm run test:verbose
) else if "%test_type%"=="unit" (
    call :print_status "Running unit tests only..."
    npm run test:unit
) else if "%test_type%"=="debug" (
    call :print_status "Running tests in debug mode..."
    npm run test:debug
) else if "%test_type%"=="clean" (
    call :print_status "Cleaning test artifacts..."
    npm run clean
    call :print_success "Cleanup completed."
) else if "%test_type%"=="build" (
    call :print_status "Building TypeScript..."
    npm run build
    call :print_success "Build completed."
) else if "%test_type%"=="lint" (
    call :print_status "Running linting..."
    npm run lint
    call :print_success "Linting completed."
) else if "%test_type%"=="lint:fix" (
    call :print_status "Running linting with auto-fix..."
    npm run lint:fix
    call :print_success "Linting with auto-fix completed."
) else (
    call :print_error "Unknown test type: %test_type%"
    call :show_usage
    exit /b 1
)
goto :eof

REM Function to show usage
:show_usage
echo Usage: %~nx0 [OPTION]
echo.
echo Options:
echo   all         Run all tests
echo   watch       Run tests in watch mode (recommended for development)
echo   coverage    Run tests with coverage report
echo   verbose     Run tests with verbose output
echo   unit        Run unit tests only
echo   debug       Run tests in debug mode
echo   clean       Clean test artifacts and dependencies
echo   build       Build TypeScript code
echo   lint        Run ESLint
echo   lint:fix    Run ESLint with auto-fix
echo   help        Show this help message
echo.
echo Examples:
echo   %~nx0 all           # Run all tests
echo   %~nx0 watch         # Run tests in watch mode
echo   %~nx0 coverage      # Run tests with coverage
echo   %~nx0 clean         # Clean up before fresh install
goto :eof

REM Function to show test status
:show_status
call :print_status "Test Environment Status:"
echo   Node.js: 
node --version
echo   npm: 
npm --version
echo   TypeScript: 
npx tsc --version
echo   Jest: 
npx jest --version
echo.

if exist "node_modules" (
    call :print_success "Dependencies: Installed"
) else (
    call :print_warning "Dependencies: Not installed"
)

if exist "dist" (
    call :print_success "Build: Compiled"
) else (
    call :print_warning "Build: Not compiled"
)

if exist "coverage" (
    call :print_success "Coverage: Available"
) else (
    call :print_warning "Coverage: Not available"
)
goto :eof

REM Main execution
:main
set test_type=%~1

REM Show banner
echo ==========================================
echo   DemoProject Authentication Tests
echo ==========================================
echo.

REM Check prerequisites
call :check_node
if errorlevel 1 exit /b 1
call :check_npm
if errorlevel 1 exit /b 1

REM Handle help
if "%test_type%"=="help" (
    call :show_usage
    exit /b 0
)
if "%test_type%"=="--help" (
    call :show_usage
    exit /b 0
)
if "%test_type%"=="-h" (
    call :show_usage
    exit /b 0
)

REM Handle status
if "%test_type%"=="status" (
    call :show_status
    exit /b 0
)

REM Install dependencies if needed
call :install_deps

REM Run tests
if defined test_type (
    call :run_tests "%test_type%"
) else (
    call :print_status "No test type specified. Running all tests..."
    call :run_tests "all"
)

goto :eof

REM Run main function with all arguments
call :main %*
