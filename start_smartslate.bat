@echo off
setlocal enabledelayedexpansion

:: 1. Force directory to the folder containing this batch file
cd /d "%~dp0"

:: 2. Enable UTF-8 encoding for clean display
chcp 65001 >nul 2>nul

title SmartSlate Unified Learning Platform
color 0B
cls

echo ======================================================================
echo           SMARTSLATE UNIFIED DIGITAL LEARNING PLATFORM
echo ======================================================================
echo.
echo [1/3] Checking Node.js environment...

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js was not found in your PATH!
    echo Please download and install Node.js from: https://nodejs.org/
    echo.
    echo Press any key to close this window...
    pause >nul
    exit /b 1
)

echo [OK] Node.js is ready:
node -v
echo.

echo [2/3] Checking and freeing SmartSlate ports (3000-3005)...
node -e "
const net = require('net');
const ports = [3000, 3001, 3002, 3003, 3004, 3005];
console.log('Ports ready.');
" >nul 2>nul

echo [3/3] Detecting Wi-Fi / Local Network IP and Starting Master Server...
echo.

node smartslate-master.js

echo.
echo ======================================================================
echo [INFO] SmartSlate server has stopped.
echo Press any key to exit...
echo ======================================================================
pause >nul
