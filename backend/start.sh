#!/bin/sh
set -e

cd /app

# Railway provides $PORT for the externally-exposed service.
# Node uses $PORT (set by Railway), Python always uses 8000 internally.
export PYTHON_SERVICE_URL="http://localhost:8000"

echo "Starting Python RAG service on port 8000..."
python python/api.py &
PY_PID=$!

echo "Waiting for Python API to become healthy..."
tries=0
until curl -sf http://localhost:8000/health >/dev/null 2>&1; do
  tries=$((tries + 1))
  if [ "$tries" -ge 300 ]; then
    echo "Python service failed to start within 5 minutes"
    kill "$PY_PID" || true
    exit 1
  fi
  sleep 1
done

echo "Python API ready. Starting Node.js server on port ${PORT:-5000}..."
exec node server.js
