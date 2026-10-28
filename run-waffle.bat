@echo off
chcp 65001 >nul
title Waffle House Cairo ERP - Port 3080
color 06
echo.
echo  ==========================================
echo   Waffle House Cairo ERP v1.0
echo   by Orca Cloud Solutions (01018671000)
echo   Port: 3080
echo  ==========================================
echo.
cd /d "%~dp0"

:: Check if already running
curl -s -o nul -w "%%{http_code}" http://localhost:3080 2>nul | findstr "200" >nul
if not errorlevel 1 (
    echo   [OK] السيرفر شغال بالفعل على http://localhost:3080
    echo   بيفتح المتصفح...
    start "" "http://localhost:3080"
    timeout /t 2 /nobreak >nul
    exit
)

node scripts\launcher.mjs
pause
