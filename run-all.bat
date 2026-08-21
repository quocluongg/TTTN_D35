@echo off
title TTTN_D35 - Run All
set "ROOT=%~dp0"

echo ===================================
echo   Khoi dong BE / FE / AI
echo ===================================

:: Backend (Spring Boot - Gradle)
start "BE - Backend" cmd /k "cd /d "%ROOT%backend" && call gradlew.bat bootRun"

:: Frontend (Next.js)
start "FE - Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

:: AI (FastAPI)
start "AI - Python" cmd /k "cd /d "%ROOT%ai" && "%ROOT%.venv\Scripts\python.exe" -X utf8 main.py"

echo Da mo 3 cua so: BE / FE / AI.
echo Nhan phim bat ky de dong cua so nay.
pause >nul
