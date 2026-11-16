@echo off
title CyberShield - Database Provisioning and Schema Update
color 0B
cd /d "%~dp0"
echo ========================================================
echo   CYBERSHIELD DATABASE SETUP AND SCHEMA MIGRATION
echo ========================================================
echo.
echo Running automated database provisioning...
echo (Applies all tables, columns including deviceId, and indexes)
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found in PATH!
    echo Please make sure Node.js is installed on this server.
    echo.
    pause
    exit /b 1
)

node setup-database.js
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ========================================================
    echo   [ERROR] Database provisioning failed!
    echo   Please check database credentials or error above.
    echo ========================================================
    echo.
    pause
    exit /b %errorlevel%
)

color 0A
echo.
echo ========================================================
echo   [SUCCESS] Database is fully up to date and ready!
echo   deviceId column, users table, and indexes are active.
echo ========================================================
echo.
pause
