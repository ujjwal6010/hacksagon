#!/bin/bash

# Janani Backend Startup Script
# Starts Python AI service first, waits for health, then starts Node

set -e

echo "📦 Starting Janani Backend Services..."

# Function to check if service is healthy
wait_for_service() {
  local url=$1
  local name=$2
  local max_attempts=30
  local attempt=0

  echo "⏳ Waiting for $name at $url..."

  while [ $attempt -lt $max_attempts ]; do
    if curl -s "$url" > /dev/null 2>&1; then
      echo "✓ $name is healthy"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done

  echo "✗ $name failed to start"
  return 1
}

# Start Python AI service in background
echo "🐍 Starting Python AI service..."
cd python
python api.py &
PYTHON_PID=$!
cd ..

# Wait for Python service to be healthy
if ! wait_for_service "http://localhost:8000/health" "Python AI Service"; then
  kill $PYTHON_PID 2>/dev/null || true
  exit 1
fi

# Start Node.js API server
echo "🚀 Starting Node.js API server..."
node server.js &
NODE_PID=$!

# Wait for Node service to be healthy
if ! wait_for_service "http://localhost:5000/health" "Node API Server"; then
  kill $PYTHON_PID $NODE_PID 2>/dev/null || true
  exit 1
fi

echo "✓ All services started successfully"

# Trap to clean up on exit
trap "kill $PYTHON_PID $NODE_PID" EXIT

# Wait for all background processes
wait
