@echo off
setlocal EnableExtensions
title CV Generator — localhost:2999

cd /d "%~dp0"
if errorlevel 1 (
  echo Failed to change to project folder.
  pause
  exit /b 1
)

echo.
echo ========================================
echo   CV Generator
echo   http://localhost:2999/
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found. Install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies ^(first run^)...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
  echo.
)

echo Starting dev server...
echo Press Ctrl+C to stop.
echo.

call npm run dev

if errorlevel 1 (
  echo.
  echo [ERROR] Dev server exited. Is port 2999 already in use?
  pause
  exit /b 1
)

endlocal
