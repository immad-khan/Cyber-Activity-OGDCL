@echo off
:: Run as Administrator to register Windows Service
echo ========================================================
echo Installing CyberShield as a 24/7 Windows Service (PM2)
echo ========================================================
echo.

:: 1. Install dependencies
echo [1/4] Installing project dependencies...
call npm install --omit=dev

:: 2. Install PM2 and Windows startup helper globally
echo [2/4] Installing PM2 and PM2 Windows Service helper globally...
call npm install -g pm2
call npm install -g pm2-windows-startup

:: 3. Register PM2 startup with Windows
echo [3/4] Registering PM2 auto-startup on Windows boot...
call pm2-startup install

:: 4. Start app and save configuration
echo [4/4] Starting server.js under PM2 and saving state...
call pm2 start server.js --name "cybershield"
call pm2 save

echo.
echo ========================================================
echo SUCCESS! CyberShield is now running 24/7 as a service.
echo - To view status:  pm2 status
echo - To view logs:    pm2 logs cybershield
echo - To restart:      pm2 restart cybershield
echo - To stop:         pm2 stop cybershield
echo ========================================================
pause
