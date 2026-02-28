#!/bin/bash

# URL de tu servicio
URL="https://unitaskis.onrender.com/api/"
# IMPORTANTE: Sin espacios alrededor del igual
INTERVAL=100

echo "------------------------------------------"
echo "🚀 Manteniendo vivo: $URL"
echo "------------------------------------------"

while true; do
  # Realiza la petición
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
  TIME=$(date +"%H:%M:%S")

  if [ "$RESPONSE" -eq 200 ]; then
    echo "[$TIME] ✅ Render está despierto (HTTP $RESPONSE)"
  else
    echo "[$TIME] ⚠️ Status: $RESPONSE (Revisar si es esperado)"
  fi
  # Aquí el sleep ya tendrá el valor de 600
  sleep $INTERVAL
done
