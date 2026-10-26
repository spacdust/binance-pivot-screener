@echo off
title Binance Coin Screener
color 0A

echo ===================================================
echo     BINANCE COIN SCREENER - LAUNCHER
echo ===================================================
echo.

:: 1. Cek instalasi Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terinstall di komputer ini!
    echo Silakan unduh dan install Node.js dari: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Cek apakah dependencies sudah terinstall
if not exist "node_modules\" (
    echo [INFO] Menginstall dependencies root...
    call npm install
)

if not exist "server\node_modules\" (
    echo [INFO] Menginstall dependencies server...
    call npm --prefix server install
)

if not exist "client\node_modules\" (
    echo [INFO] Menginstall dependencies client...
    call npm --prefix client install
)

echo.
echo [INFO] Membuka browser (http://localhost:5173)...
start /min cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

echo [INFO] Menjalankan Server (Port 5000) dan Client Vite (Port 5173)...
echo Tekan Ctrl+C untuk menghentikan aplikasi.
echo.
call npm run dev
pause
