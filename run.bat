@echo off
setlocal EnableDelayedExpansion
title Binance Coin Screener - Auto Sync & Launcher
color 0A

echo ========================================================
echo        BINANCE COIN SCREENER - PRO PIVOT LAUNCHER
echo ========================================================
echo.

:: 1. Verifikasi instalasi Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terinstall di komputer ini!
    echo Silakan unduh dan install Node.js (LTS) dari: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Auto Git Sync: Selalu cek dan tarik update terbaru dari GitHub
where git >nul 2>nul
if %errorlevel% equ 0 (
    if exist ".git\" (
        echo [GIT] Memeriksa pembaruan terbaru dari GitHub...
        git pull origin main
        echo [GIT] Sinkronisasi Git selesai.
        echo.
    )
) else (
    echo [INFO] Git tidak ditemukan di PATH, melewati pengecekan git pull otomatis.
    echo.
)

:: 3. Verifikasi & Instalasi Dependencies Otomatis
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

:: 4. Build Frontend Client jika belum ada
if not exist "client\dist\" (
    echo [INFO] Membangun (build) frontend client untuk pertama kali...
    call npm --prefix client run build
)

echo.
echo ========================================================
echo  Backend Server : http://localhost:5000 (API & WS)
echo  Frontend Web   : http://localhost:5173 (Vite Live App)
echo ========================================================
echo.
echo [INFO] Membuka browser dalam 4 detik...
start /min cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:5173"

echo [INFO] Menjalankan Screener Server & Client Vite...
echo Tekan Ctrl+C untuk menghentikan aplikasi.
echo.
call npm run dev
pause
