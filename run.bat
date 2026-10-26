@echo off
cd /d "%~dp0"
title Binance Futures Screener Launcher
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

:: 2. Auto Git Sync: Tarik update terbaru dari GitHub
where git >nul 2>nul
if %errorlevel% equ 0 (
    if exist ".git\" (
        echo [GIT] Memeriksa update terbaru dari GitHub...
        call git pull origin main
        echo [GIT] Sinkronisasi Git selesai.
        echo.
    )
) else (
    echo [INFO] Git tidak terdeteksi di PATH, melewati update git otomatis.
    echo.
)

:: 3. Verifikasi instalasi dependensi (npm install otomatis jika belum ada)
if not exist "node_modules\" (
    echo [INFO] Menginstall dependencies root project...
    call npm install
)

if not exist "server\node_modules\" (
    echo [INFO] Menginstall dependencies backend server...
    call npm --prefix server install
)

if not exist "client\node_modules\" (
    echo [INFO] Menginstall dependencies frontend client...
    call npm --prefix client install
)

:: 4. Bebaskan port 5000 dan 5173 dari proses gantung sebelumnya
echo [INFO] Membersihkan port 5000 dan 5173...
powershell -NoProfile -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 5000, 5173 -State Listen -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>nul

echo.
echo ========================================================
echo  Backend Server : http://127.0.0.1:5000 (API & WS)
echo  Frontend Web   : http://localhost:5173 (Live Screener)
echo ========================================================
echo.
echo [INFO] Membuka browser dalam 5 detik...
start /min cmd /c "timeout /t 5 >nul & start http://localhost:5173"

echo [INFO] Menjalankan Server & Vite...
echo Tekan Ctrl+C untuk menghentikan aplikasi kapan saja.
echo.
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [INFO] Aplikasi telah berhenti.
    pause
)
