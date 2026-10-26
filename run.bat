@echo off
title Binance Coin Screener Launcher
color 0A

echo ========================================================
echo        BINANCE COIN SCREENER - PRO PIVOT LAUNCHER
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

:: 2. Auto Git Sync: Cek pembaruan terbaru dari GitHub
where git >nul 2>nul
if %errorlevel% equ 0 (
    if exist ".git\" (
        echo [GIT] Memeriksa dan mengambil update terbaru dari GitHub...
        call git pull origin main
        echo [GIT] Sinkronisasi Git selesai.
        echo.
    )
) else (
    echo [INFO] Git tidak ditemukan di PATH, melewati update git otomatis.
    echo.
)

:: 3. Verifikasi instalasi dependensi (npm install)
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

:: 4. Build Frontend Client jika dist belum tersedia
if not exist "client\dist\" (
    echo [INFO] Membangun bundle frontend client...
    call npm --prefix client run build
)

echo.
echo ========================================================
echo  Backend Server : http://localhost:5000
echo  Frontend Web   : http://localhost:5173
echo ========================================================
echo.
echo [INFO] Membuka browser dalam 4 detik...
start /min cmd /c "timeout /t 4 >nul & start http://localhost:5173"

echo [INFO] Menjalankan Screener Server dan Client Vite...
echo Tekan Ctrl+C untuk menghentikan aplikasi kapan saja.
echo.
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [INFO] Aplikasi telah berhenti.
    pause
)
