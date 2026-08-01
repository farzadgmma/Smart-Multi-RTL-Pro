@echo off
chcp 65001 > nul
title نصب خودکار Multi-RTL Pro | مبتکران نیک افزار

echo =================================================================
echo   کمپانی مبتکران نیک افزار - نصب خودکار افزونه Multi-RTL Pro
echo =================================================================
echo.
echo در حال آماده‌سازی و استخراج فایل‌های افزونه در سیستم...

set DEST_DIR=%LOCALAPPDATA%\MobtakeranNikAfzar\MultiRTLPro
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%"

rem کپی فایل‌های افزونه (بدون پوشه‌های توسعه، فایل‌های ZIP و EXE)
robocopy "%~dp0" "%DEST_DIR%" /E /XD ".git" "scratch" /XF "*.zip" "*.exe" /NFL /NDL /NJH /NJS > nul
if %ERRORLEVEL% GEQ 8 (
    echo [✗] خطا در کپی فایل‌ها! لطفا دوباره تلاش کنید.
    pause
    exit /b 1
)

echo %DEST_DIR%| clip
echo.
echo [✓] پوشه افزونه در مسیر زیر ذخیره شد:
echo     %DEST_DIR%
echo [✓] آدرس فوق خودکار در حافظه ویندوز (Paste / Ctrl+V) کپی شد!
echo.
echo در حال باز کردن راهنمای تصویری و صفحه افزونه‌های کروم...

start "" "%DEST_DIR%\guide.html"
timeout /t 2 > nul
start chrome chrome://extensions

echo.
echo =================================================================
echo   نصب فایل‌ها انجام شد. لطفا راهنمای باز شده در کروم را ببینید.
echo =================================================================
pause
