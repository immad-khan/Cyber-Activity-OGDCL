@echo off
setlocal enabledelayedexpansion
title CyberShield - Uninstall Windows Service
color 0C
cd /d "%~dp0"

echo ========================================================
echo   CYBERSHIELD WINDOWS SERVICE UNINSTALLER
echo ========================================================
echo.

:: Check for Administrator Privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Administrator privileges are required.
    echo Please RIGHT-CLICK this file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

set "SERVICE_NAME=CyberShield"

:: Check NSSM
where nssm.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo Stopping %SERVICE_NAME% service...
    nssm stop "%SERVICE_NAME%" >nul 2>&1
    echo Removing %SERVICE_NAME% service...
    nssm remove "%SERVICE_NAME%" confirm
    echo.
    echo Service %SERVICE_NAME% has been uninstalled successfully.
) else (
    echo Checking Scheduled Tasks...
    schtasks /delete /tn "%SERVICE_NAME%" /f >nul 2>&1
    echo Stopping running node instances...
    taskkill /F /IM node.exe 2>nul
    echo.
    echo Service %SERVICE_NAME% task removed.
)

echo.
pause
