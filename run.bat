@echo off
cd /d "%~dp0"
title Binance Futures Screener
color 0A

echo ========================================================
echo     BINANCE FUTURES SCREENER (PERP) - PRO LAUNCHER
echo ========================================================
echo.

:: 1. Verifikasi instalasi Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terinstall di komputer ini!
    echo Silakan unduh dan install Node.js dari https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Auto Git Sync
where git >nul 2>nul
if %errorlevel% equ 0 (
    if exist ".git\" (
        echo [GIT] Memeriksa update terbaru dari GitHub...
        call git pull origin main
        echo [GIT] Sinkronisasi selesai.
        echo.
    )
)

:: 3. Verifikasi dependensi
if not exist "node_modules\" call npm install
if not exist "server\node_modules\" call npm --prefix server install
if not exist "client\node_modules\" call npm --prefix client install

:: 4. Bersihkan port 5000 & 5173 dari sisa proses sebelumnya
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo [INFO] Menjalankan Binance Futures Screener...
echo Tekan Ctrl+C untuk menghentikan aplikasi kapan saja.
echo.

call npm run dev
pause
