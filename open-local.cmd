@echo off
cd /d "%~dp0"
echo Abriendo MSM MY STORE en modo local...
echo.
echo Se abrira una ventana con el servidor. No cierres esa ventana mientras estes probando.
echo Espera a que diga "Ready". El navegador se abrira cuando el puerto 3000 este listo.
echo.
start "MSM MY STORE local server" cmd /k powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-local.ps1"

echo Esperando que MSM MY STORE este listo en http://localhost:3000 ...
for /l %%i in (1,1,60) do (
  powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>nul
  if not errorlevel 1 goto ready
  timeout /t 1 /nobreak >nul
)

echo.
echo No pude confirmar el puerto 3000 automaticamente.
echo Si la ventana del servidor dice Ready, abre http://localhost:3000 manualmente.
pause
exit /b 1

:ready
echo Servidor listo. Abriendo navegador...
start http://localhost:3000
