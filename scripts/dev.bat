@echo off
REM DemoProject Development Script for Windows
REM Provides easy access to common development commands

setlocal enabledelayedexpansion

if "%1"=="" goto help

if "%1"=="install" goto install
if "%1"=="dev" goto dev
if "%1"=="dev:turbo" goto dev_turbo
if "%1"=="build" goto build
if "%1"=="clean" goto clean
if "%1"=="type-check" goto type_check
if "%1"=="lint" goto lint
if "%1"=="docker:build" goto docker_build
if "%1"=="docker:run" goto docker_run
if "%1"=="infra:build" goto infra_build
if "%1"=="infra:deploy" goto infra_deploy
if "%1"=="infra:status" goto infra_status
if "%1"=="workflow" goto workflow
goto help

:install
echo Installing project dependencies...
call npm install
echo Installing CDK dependencies...
cd cdk
call npm install
cd ..
echo Dependencies installed successfully!
goto end

:dev
echo Starting development server...
call npm run dev
goto end

:dev_turbo
echo Starting development server with Turbopack...
call npm run dev:turbo
goto end

:build
echo Building Next.js application...
call npm run build
goto end

:clean
echo Cleaning build artifacts...
if exist .next rmdir /s .next
if exist out rmdir /s out
if exist dist rmdir /s dist
cd cdk
if exist dist rmdir /s dist
cd ..
echo Build artifacts cleaned!
goto end

:type_check
echo Running TypeScript type check...
call npm run type-check
goto end

:lint
echo Running ESLint...
call npm run lint
goto end

:docker_build
echo Building Docker image...
docker build -t demoproject-app:latest .
goto end

:docker_run
echo Running Docker container...
docker run -p 3000:3000 demoproject-app:latest
goto end

:infra_build
echo Building CDK infrastructure...
cd cdk
call npm run build
cd ..
goto end

:infra_deploy
echo Deploying all infrastructure...
cd cdk
call npm run deploy:all
cd ..
goto end

:infra_status
echo Showing infrastructure status...
cd cdk
call npm run status
cd ..
goto end

:workflow
echo Running complete development workflow...
call :install
call :type_check
call :lint
call :build
call :docker_build
call :infra_build
echo Full development workflow completed!
echo.
echo Next steps:
echo 1. Start development: npm run dev
echo 2. Deploy infrastructure: npm run infra:deploy
goto end

:help
echo DemoProject - Available Commands
echo =================================
echo.
echo Development:
echo   dev.bat install        Install all dependencies
echo   dev.bat dev            Start development server
echo   dev.bat dev:turbo     Start development server with Turbopack
echo   dev.bat build         Build Next.js application
echo   dev.bat clean         Clean build artifacts
echo   dev.bat type-check    Run TypeScript type checking
echo   dev.bat lint          Run ESLint
echo.
echo Docker:
echo   dev.bat docker:build  Build Docker image
echo   dev.bat docker:run    Run Docker container locally
echo.
echo Infrastructure:
echo   dev.bat infra:build   Build CDK infrastructure
echo   dev.bat infra:deploy  Deploy all infrastructure
echo   dev.bat infra:status  Show infrastructure status
echo.
echo Full Workflow:
echo   dev.bat workflow      Run complete development workflow
echo.
echo Examples:
echo   dev.bat install       # Install dependencies
echo   dev.bat dev           # Start development server
echo   dev.bat workflow      # Run full workflow

:end
endlocal
