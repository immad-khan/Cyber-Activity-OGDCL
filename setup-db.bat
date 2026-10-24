@echo off
title CyberShield - Database Provisioning
color 0B
cd /d "%~dp0"
echo ========================================================
echo   CYBERSHIELD LOCAL DATABASE SETUP
echo ========================================================
echo.
echo Running automated database provisioning...
echo.
node setup-database.js
echo.
echo ========================================================
echo Done! If you saw green checkmarks above, the DB is ready.
echo ========================================================
echo.
pause
