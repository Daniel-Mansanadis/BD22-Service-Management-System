@echo off
title BD22 Fire System - Local Server
cd /d "%~dp0"
echo ===================================================
echo   BD22 Fire System ^& Builders Inc. (Serverless)
echo   Powered by Supabase Cloud (No XAMPP Needed)
echo ===================================================
echo.
echo Starting local server on http://localhost:8080...
echo.
start http://localhost:8080
python scratch\serve_static.py
if %errorlevel% neq 0 (
    echo.
    echo Python server failed. Please install Python and try again.
)
pause
