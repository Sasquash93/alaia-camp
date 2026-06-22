@echo off
title Alaia Camp - Online
setlocal
set ROOT=%~dp0
set CF=%ROOT%cloudflared.exe

REM 1) Descarga cloudflared la primera vez
if not exist "%CF%" (
  echo Descargando Cloudflare Tunnel ^(solo la primera vez^)...
  powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%CF%'"
)

REM 2) Instala dependencias del backend la primera vez
if not exist "%ROOT%server\node_modules" (
  echo Instalando dependencias del backend ^(solo la primera vez^)...
  pushd "%ROOT%server" && call npm install && popd
)

REM 3) Levanta el backend en otra ventana
echo Iniciando backend en http://localhost:4000 ...
start "Alaia Backend" cmd /k "cd /d "%ROOT%server" && node server.js"
timeout /t 4 >nul

REM 4) Abre el tunel publico. Copia la URL https://....trycloudflare.com
echo.
echo ================================================================
echo  Copia la URL  https://XXXX.trycloudflare.com  que aparece abajo
echo  y mandala. Deja esta ventana abierta mientras la enseñas.
echo  Panel admin:  esa-URL/admin.html
echo ================================================================
echo.
"%CF%" tunnel --url http://localhost:4000 --no-autoupdate
