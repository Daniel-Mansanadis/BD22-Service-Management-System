@echo off
title BD22 - Deploy to Vercel Cloud
cd /d "%~dp0"
echo ===================================================
echo   BD22 Fire System - Deploy to Vercel Cloud
echo   Target: https://bd22-website.vercel.app
echo ===================================================
echo.
cmd /c npx vercel --prod
echo.
pause
