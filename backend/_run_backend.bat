@echo off
title [BACKEND] IT Inventory API
color 0A
cd /d "%~dp0"
echo.
echo  =============================================
echo    BACKEND API  -  DO NOT CLOSE THIS WINDOW
echo  =============================================
echo.
echo  Running at: http://localhost:8000
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

echo.
echo  [!] Backend stopped.
pause
