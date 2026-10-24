@echo off
setlocal enabledelayedexpansion
title CyberShield - Windows Service Installation (NSSM)
color 0B

echo ========================================================
echo   CYBERSHIELD 24/7 WINDOWS SERVICE INSTALLER
echo ========================================================
echo.

:: Check for Administrator Privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Administrator privileges are required to install a Windows Service.
    echo.
    echo Please RIGHT-CLICK this file and select:
    echo   "Run as administrator"
    echo.
    pause
    exit /b 1
)

:: Project Directory (Auto-detected: no need to edit even if moved)
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
cd /d "%PROJECT_DIR%"

:: 1. Locate Node.js
echo [1/4] Locating Node.js runtime...
set "NODE_EXE="
for /f "delims=" %%I in ('where node.exe 2^>nul') do (
    if not defined NODE_EXE set "NODE_EXE=%%I"
)

if not defined NODE_EXE (
    if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"
    if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_EXE=C:\Program Files (x86)\nodejs\node.exe"
)

if not defined NODE_EXE (
    color 0C
    echo [ERROR] node.exe was not found on this system.
    echo Please install Node.js (https://nodejs.org) before installing the service.
    echo.
    pause
    exit /b 1
)
echo       Found Node: "%NODE_EXE%"

:: 2. Locate NSSM
echo [2/4] Locating NSSM (Non-Sucking Service Manager)...
set "NSSM_EXE="
for /f "delims=" %%I in ('where nssm.exe 2^>nul') do (
    if not defined NSSM_EXE set "NSSM_EXE=%%I"
)

if not defined NSSM_EXE (
    if exist "%PROJECT_DIR%\nssm.exe" set "NSSM_EXE=%PROJECT_DIR%\nssm.exe"
    if exist "C:\nssm\nssm.exe" set "NSSM_EXE=C:\nssm\nssm.exe"
    if exist "C:\nssm\win64\nssm.exe" set "NSSM_EXE=C:\nssm\win64\nssm.exe"
    if exist "C:\Program Files\nssm\nssm.exe" set "NSSM_EXE=C:\Program Files\nssm\nssm.exe"
    if exist "C:\Program Files\nssm\win64\nssm.exe" set "NSSM_EXE=C:\Program Files\nssm\win64\nssm.exe"
)

:: 3. Check for dependencies
echo [3/4] Verifying project node_modules...
if exist "%PROJECT_DIR%\node_modules\" (
    echo       node_modules found. (Offline-ready)
) else (
    echo       node_modules missing. Attempting npm install...
    call npm install --omit=dev
)

:: 4. Installation via NSSM or Fallback
echo [4/4] Configuring Windows Service "CyberShield"...
set "SERVICE_NAME=CyberShield"

if defined NSSM_EXE (
    echo       Using NSSM at: "%NSSM_EXE%"
    
    :: Stop and remove previous installation if it exists
    "%NSSM_EXE%" stop "%SERVICE_NAME%" >nul 2>&1
    "%NSSM_EXE%" remove "%SERVICE_NAME%" confirm >nul 2>&1

    :: Install Service with NSSM
    "%NSSM_EXE%" install "%SERVICE_NAME%" "%NODE_EXE%" "\"%PROJECT_DIR%\server.js\""
    "%NSSM_EXE%" set "%SERVICE_NAME%" AppDirectory "%PROJECT_DIR%"
    "%NSSM_EXE%" set "%SERVICE_NAME%" DisplayName "CyberShield Platform Service"
    "%NSSM_EXE%" set "%SERVICE_NAME%" Description "24/7 Web Server for CyberShield / OGDCL Cybersecurity Awareness Platform"
    "%NSSM_EXE%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START

    :: Configure log files
    "%NSSM_EXE%" set "%SERVICE_NAME%" AppStdout "%PROJECT_DIR%\service-out.log"
    "%NSSM_EXE%" set "%SERVICE_NAME%" AppStderr "%PROJECT_DIR%\service-err.log"
    "%NSSM_EXE%" set "%SERVICE_NAME%" AppRotateFiles 1
    "%NSSM_EXE%" set "%SERVICE_NAME%" AppRotateOnline 1
    "%NSSM_EXE%" set "%SERVICE_NAME%" AppRotateBytes 10485760

    :: Restart policy: restart after 3 seconds on crash
    "%NSSM_EXE%" set "%SERVICE_NAME%" AppRestartDelay 3000

    :: Start the service
    "%NSSM_EXE%" start "%SERVICE_NAME%"

    color 0A
    echo.
    echo ========================================================
    echo SUCCESS! CyberShield Windows Service Installed via NSSM!
    echo ========================================================
    echo  Service Name : %SERVICE_NAME%
    echo  Startup Type : Automatic (Starts when Windows boots)
    echo  Status       : RUNNING 24/7 in background
    echo.
    echo  Management Commands:
    echo    - Check in Windows Services : services.msc
    echo    - Start service             : nssm start %SERVICE_NAME%
    echo    - Stop service              : nssm stop %SERVICE_NAME%
    echo    - Restart service           : nssm restart %SERVICE_NAME%
    echo    - View live logs            : %PROJECT_DIR%\service-out.log
    echo ========================================================
) else (
    echo.
    echo [!] NSSM was not found in PATH or standard folders.
    echo Falling back to Windows Task Scheduler (100%% offline, built-in)...
    schtasks /create /tn "%SERVICE_NAME%" /tr "\"%NODE_EXE%\" \"%PROJECT_DIR%\server.js\"" /sc onstart /ru SYSTEM /f >nul 2>&1
    schtasks /run /tn "%SERVICE_NAME%" >nul 2>&1
    
    color 0A
    echo.
    echo ========================================================
    echo SUCCESS! CyberShield Registered via Windows Task Scheduler.
    echo Runs 24/7 on system boot under task name: %SERVICE_NAME%
    echo ========================================================
)

echo.
pause
