@echo off
REM DemoProject Configuration Switcher
REM Switches between regular and Turbopack configurations

if "%1"=="" goto help

if "%1"=="regular" goto regular
if "%1"=="turbopack" goto turbopack
if "%1"=="status" goto status
goto help

:regular
echo Switching to regular Next.js configuration...
copy next.config.ts next.config.regular.ts
copy next.config.ts next.config.ts
echo Configuration switched to regular mode.
echo Use: npm run dev
goto end

:turbopack
echo Switching to Turbopack-compatible configuration...
copy next.config.turbopack.ts next.config.ts
echo Configuration switched to Turbopack mode.
echo Use: npm run dev:turbo
goto end

:status
echo Current configuration status:
if exist next.config.ts (
    echo Main config: next.config.ts
    echo Type: Regular Next.js (compatible with both modes)
) else (
    echo Main config: NOT FOUND
)
if exist next.config.turbopack.ts (
    echo Turbopack config: next.config.turbopack.ts
) else (
    echo Turbopack config: NOT FOUND
)
goto end

:help
echo DemoProject Configuration Switcher
echo =================================
echo.
echo Usage: switch-config.bat [OPTION]
echo.
echo Options:
echo   regular     Switch to regular Next.js configuration
echo   turbopack   Switch to Turbopack-compatible configuration
echo   status      Show current configuration status
echo   help        Show this help message
echo.
echo Examples:
echo   switch-config.bat regular     # Use regular Next.js
echo   switch-config.bat turbopack   # Use Turbopack
echo   switch-config.bat status      # Check current config

:end
