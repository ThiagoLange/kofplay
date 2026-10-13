#!/usr/bin/env bash
# KofPlay — script de execução
# Uso: ./run.sh [porta]
set -e
PORT="${1:-${KOF_SERVER_PORT:-8081}}"

if ! command -v kof >/dev/null 2>&1; then
  if [ -x "$HOME/.kof/bin/kof" ]; then
    export PATH="$HOME/.kof/bin:$PATH"
  else
    echo "ERRO: 'kof' não encontrado. Instale e/ou exporte PATH=\"\$HOME/.kof/bin:\$PATH\"." >&2
    exit 1
  fi
fi

if command -v lsof >/dev/null 2>&1 && lsof -ti:"$PORT" >/dev/null 2>&1; then
  echo "ERRO: porta $PORT já está em uso. Pare o processo ou escolha outra: ./run.sh 9090" >&2
  exit 1
fi

export KOF_SERVER_PORT="$PORT"
cd "$(dirname "$0")"
echo "KofPlay em http://localhost:$PORT  (health: /api/health)"
exec kof run Main.kf
