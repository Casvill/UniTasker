@echo off
setlocal

:: Configuración de colores (Windows)
echo Iniciando entorno de desarrollo de UniTasker...

:: 1. Iniciar Backend
echo Inicia Django Backend en una nueva ventana...
start "UniTasker Backend" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"

:: 2. Iniciar Frontend
echo Inicia Next.js Frontend en una nueva ventana...
start "UniTasker Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ----------------------------------------------------
echo [INFO] Ambos servidores se estan iniciando!
echo Backend estara en: http://127.0.0.1:8000
echo Frontend estara en: http://localhost:3000
echo ----------------------------------------------------
echo Cierra las ventanas emergentes para detener cada servidor.
echo.

pause
