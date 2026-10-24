@echo off
title Stop CyberShield Server
color 0C
echo ========================================================
echo   STOPPING CYBERSHIELD SERVER PROCESSES
echo ========================================================
echo.
echo Stopping Node.js server...
taskkill /F /FI "WINDOWTITLE eq CyberShield*" 2>nul
taskkill /F /IM node.exe 2>nul
echo.
echo All CyberShield server processes have been stopped.
echo.
pause
