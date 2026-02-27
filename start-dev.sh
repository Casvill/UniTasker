#!/bin/bash

# Colores para la terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando entorno de desarrollo de UniTasker...${NC}"

# Función para detener los procesos al salir (Ctrl+C)
cleanup() {
    echo -e "
${BLUE}🛑 Deteniendo servidores...${NC}"
    kill $BACKEND_PID $FRONTEND_PID
    exit
}

trap cleanup EXIT

# 1. Iniciar Backend
echo -e "${GREEN}🐍 Iniciando Django Backend...${NC}"
cd backend
source venv/bin/activate
python manage.py runserver &
BACKEND_PID=$!
cd ..

# 2. Iniciar Frontend
echo -e "${GREEN}⚛️ Iniciando Next.js Frontend...${NC}"
cd frontendv1
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "${BLUE}✅ Ambos servidores están corriendo!${NC}"
echo -e "Backend: http://127.0.0.1:8000"
echo -e "Frontend: http://localhost:3000"
echo -e "Presiona [Ctrl+C] para detener ambos."

# Mantener el script vivo para ver los logs
wait
