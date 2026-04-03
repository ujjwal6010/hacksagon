#!/bin/sh
set -e

cd /app || cd .

echo "Installing Python dependencies..."
pip install --no-cache-dir -r requirements.txt

echo "Starting Python API on port 8000..."
python python/api.py &
PY_PID=$!

echo "Waiting for Python API to become healthy..."
tries=0
until curl -sf http://localhost:8000/docs >/dev/null 2>&1; do
  tries=$((tries + 1))
  if [ "$tries" -ge 120 ]; then
    echo "Python service failed to start within timeout"
    kill "$PY_PID" || true
    exit 1
  fi
  sleep 1
done

echo "Python API ready. Starting Node server..."
node server.js
