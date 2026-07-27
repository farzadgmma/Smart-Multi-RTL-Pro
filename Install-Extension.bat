@echo off
chcp 65001 > nul
title نصب آسان افزونه Multi-RTL Pro - مبتکران نیک افزار

echo ========================================================
echo   افزونه Smart Multi-RTL Pro | مبتکران نیک افزار
echo ========================================================
echo.
echo در حال باز کردن صفحه افزونه های گوگل کروم...
echo.

set EXT_DIR=%~dp0
echo مسیر پوشه افزونه: %EXT_DIR%
echo %EXT_DIR%| clip
echo (مسیر پوشه در حافظه کپی شد!)

echo.
echo راهنما:
echo 1. در مرورگر کروم، گزینه Developer mode را از بالا سمت راست روشن کنید.
echo 2. روی دکمه Load unpacked کلیک کنید.
echo 3. مسیر این پوشه را انتخاب کنید.
echo.

start chrome chrome://extensions

pause
