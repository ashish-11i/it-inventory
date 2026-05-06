@echo off
setlocal enabledelayedexpansion

:: ── Auto-elevate to Administrator ────────────────────────────
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator access...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

title IT Inventory - Setup
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "PYTHON_CMD=python"
set "NEED_RESTART=0"

cls
echo.
echo  +============================================================+
echo  ^|         IT INVENTORY SYSTEM  -  AUTO SETUP                ^|
echo  +============================================================+
echo.

:: ── STEP 1: Check Python ──────────────────────────────────────
echo  [1/4] Checking Python...

python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo        Found: %%v
    set "PYTHON_CMD=python"
    goto :check_node
)

py --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('py --version 2^>^&1') do echo        Found: %%v
    set "PYTHON_CMD=py"
    goto :check_node
)

echo        Not found. Installing Python 3.11...
echo        Please wait (1-3 minutes)...
winget install -e --id Python.Python.3.11 --silent --accept-source-agreements --accept-package-agreements

if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Could not install Python automatically.
    echo    1. Open: https://www.python.org/downloads/
    echo    2. Download Python 3.11
    echo    3. CHECK "Add Python to PATH" during install
    echo    4. Run START.bat again
    echo.
    pause
    exit /b
)
echo        Python installed! Close and run START.bat again.
set "NEED_RESTART=1"

:: ── STEP 2: Check Node.js ─────────────────────────────────────
:check_node
echo.
echo  [2/4] Checking Node.js...

node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo        Found: Node.js %%v
    goto :after_node
)

echo        Not found. Installing Node.js LTS...
echo        Please wait (2-4 minutes)...
winget install -e --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements

if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Could not install Node.js automatically.
    echo    1. Open: https://nodejs.org/
    echo    2. Download LTS version
    echo    3. Install with default options
    echo    4. Run START.bat again
    echo.
    pause
    exit /b
)
echo        Node.js installed!
set "NEED_RESTART=1"

:after_node

if "%NEED_RESTART%"=="1" (
    echo.
    echo  +------------------------------------------------------------+
    echo  ^|  New software installed!                                   ^|
    echo  ^|  Please CLOSE this window and run START.bat again.        ^|
    echo  +------------------------------------------------------------+
    echo.
    pause
    exit /b
)

:: ── STEP 3: Python packages ───────────────────────────────────
echo.
echo  [3/4] Checking Python packages...

:: If uvicorn and fastapi already work, skip install
%PYTHON_CMD% -c "import uvicorn, fastapi, openpyxl" >nul 2>&1
if %errorlevel% equ 0 (
    echo        Already installed. Skipping.
    goto :check_npm
)

echo        Installing packages...
echo        (First time may take 2-3 minutes)

:: Upgrade pip first
%PYTHON_CMD% -m pip install --upgrade pip -q --disable-pip-version-check 2>nul

:: Install using only pre-built wheels (no Rust/C++ compilation needed)
:: This works for Python 3.9 to 3.13+
%PYTHON_CMD% -m pip install -r "%BACKEND%\requirements.txt" ^
    --prefer-binary ^
    -q --disable-pip-version-check

if %errorlevel% neq 0 (
    echo.
    echo  Retrying with different method...
    %PYTHON_CMD% -m pip install ^
        "fastapi>=0.115.0" ^
        "uvicorn[standard]>=0.32.0" ^
        "openpyxl>=3.1.2" ^
        "python-multipart>=0.0.12" ^
        "pydantic>=2.10.0" ^
        --prefer-binary -q --disable-pip-version-check
)

if %errorlevel% neq 0 (
    echo.
    echo  +------------------------------------------------------------+
    echo  ^|  ERROR: Failed to install Python packages.                 ^|
    echo  ^|                                                            ^|
    echo  ^|  Possible fix:                                             ^|
    echo  ^|  Your Python version may be too new.                      ^|
    echo  ^|  Please install Python 3.11 from:                        ^|
    echo  ^|  https://www.python.org/downloads/release/python-3119/   ^|
    echo  ^|  Then run START.bat again.                                ^|
    echo  +------------------------------------------------------------+
    echo.
    pause
    exit /b
)
echo        Done!

:: ── STEP 4: Node packages ─────────────────────────────────────
:check_npm
echo.
echo  [4/4] Checking Node.js packages...

if exist "%FRONTEND%\node_modules\vite" (
    echo        Already installed. Skipping.
    goto :launch
)

echo        Installing packages (first time only)...
cd /d "%FRONTEND%"
call npm install --loglevel=error 2>nul

if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Failed to install Node.js packages.
    echo  Check internet connection and try again.
    echo.
    pause
    exit /b
)
echo        Done!

:: ── Launch Servers ────────────────────────────────────────────
:launch
echo.
echo  +============================================================+
echo  ^|  All ready! Launching servers...                          ^|
echo  +============================================================+
echo.

echo  Starting Backend...
start "IT Inventory - Backend" "%BACKEND%\_run_backend.bat"
timeout /t 3 /nobreak >nul

echo  Starting Frontend...
start "IT Inventory - Frontend" "%FRONTEND%\_run_frontend.bat"
timeout /t 5 /nobreak >nul

echo  Opening browser...
start http://localhost:3000

set "MY_IP=your-PC-IP"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "TMP=%%a"
    set "TMP=!TMP: =!"
    if not "!TMP!"=="" set "MY_IP=!TMP!"
)

echo.
echo  +============================================================+
echo  ^|                                                            ^|
echo  ^|   IT INVENTORY IS RUNNING!                                ^|
echo  ^|                                                            ^|
echo  ^|   This PC :  http://localhost:3000                        ^|
echo  ^|   Network :  http://!MY_IP!:3000                     ^|
echo  ^|                                                            ^|
echo  ^|   Share Network URL with your IT team.                    ^|
echo  ^|   TO STOP: Close the green and blue CMD windows.         ^|
echo  ^|                                                            ^|
echo  +============================================================+
echo.
echo  You can close this window now.
echo.
pause
