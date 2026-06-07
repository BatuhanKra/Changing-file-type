@echo off
chcp 65001 >nul
title Dosya Cevirme Araci - Sunucu
cd /d "%~dp0"

echo Sunucu baslatiliyor, lutfen bekleyin...
echo (Bu pencereyi KAPATMAYIN - site calisirken acik kalmali)
echo.

set NEXT_TELEMETRY_DISABLED=1

start "" cmd /c "timeout /t 6 >nul && start http://localhost:3000"

call npm run dev

pause
