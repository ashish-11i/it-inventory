@echo off
title [FRONTEND] IT Inventory UI
color 0B
cd /d "%~dp0"
echo.
echo  =============================================
echo    FRONTEND UI SERVER  -  DO NOT CLOSE
echo  =============================================
echo.
echo  Running at: http://localhost:3000
echo.

npm run dev

echo.
echo  [!] Frontend stopped. Press any key to close.
pause >nul
