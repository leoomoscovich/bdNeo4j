#!/bin/bash
# Deploy cs2-skin-graph al servidor leito (100.73.32.33)
# Uso: bash scripts/deploy.sh
# Requiere: SSH key de esta máquina autorizada en el servidor

set -e

SERVER="leito@100.73.32.33"
REMOTE_DIR="/home/leito/cs2-skin-graph"
SERVICE="cs2-skin-graph"
PORT=3009
PACKAGE="/tmp/cs2-skin-graph.tar.gz"

echo "=== [1/4] Build ==="
cd "$(dirname "$0")/.."
if [ "$SKIP_BUILD" = "1" ]; then
  echo "SKIP_BUILD=1 — usando el .next ya buildeado (correr 'npm run build' en PowerShell antes)"
else
  rm -rf .next/dev
  npm run build
fi

echo "=== [2/4] Empaquetar ==="
tar --exclude='.next/dev' \
    --exclude='.next/cache' \
    --exclude='public/animation' \
    -czf "$PACKAGE" \
    .next public package.json package-lock.json
echo "Paquete: $(du -sh $PACKAGE | cut -f1)"

echo "=== [3/4] Subir y extraer en servidor ==="
scp "$PACKAGE" "$SERVER:/tmp/"
# Borrar el .next viejo antes de extraer: extraer encima mezcla chunks de
# builds distintos y rompe el CSS/JS servido (build corrupto en prod).
ssh "$SERVER" "
  cd $REMOTE_DIR &&
  rm -rf .next &&
  tar -xzf /tmp/cs2-skin-graph.tar.gz &&
  rm /tmp/cs2-skin-graph.tar.gz &&
  npm install --omit=dev --silent
"
rm "$PACKAGE"

echo "=== [4/4] Reiniciar servicio ==="
ssh "$SERVER" "echo '\$SUDO_PASS' | sudo -S systemctl restart $SERVICE 2>/dev/null || systemctl restart $SERVICE"

# Verificar
sleep 3
STATUS=$(ssh "$SERVER" "systemctl is-active $SERVICE")
HTTP=$(curl -s -o /dev/null -w "%{http_code}" https://cs2.lmstores.com/ 2>/dev/null || echo "pending")

echo ""
echo "=== Resultado ==="
echo "  Servicio:  $STATUS"
echo "  URL local: http://100.73.32.33:$PORT"
echo "  URL pública: https://cs2.lmstores.com  (HTTP $HTTP)"
