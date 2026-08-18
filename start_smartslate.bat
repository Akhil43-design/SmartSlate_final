@echo off
title SmartSlate Unified Learning Platform
color 0B
cls

echo ======================================================================
echo           SMARTSLATE UNIFIED DIGITAL LEARNING PLATFORM
echo ======================================================================
echo.
echo [1/2] Checking environment...

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js (v18 or v20 or v22) from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found:
node -v
echo.
echo [2/2] Detecting Wi-Fi / Local Network IP and Starting Services...
echo.

node smartslate-master.js

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] SmartSlate server exited with an error code.
    echo.
    pause
)
