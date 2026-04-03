# Multi-stage Dockerfile for Janani Backend

# Stage 1: Node.js API Layer
FROM node:20-alpine AS node_builder

WORKDIR /app

COPY package*.json ./

RUN npm install --production

# Stage 2: Python AI Service
FROM python:3.11-slim AS python_builder

WORKDIR /app/python

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Final Image
FROM node:20-alpine

RUN apk add --no-cache python3 curl

WORKDIR /app

# Copy Node dependencies from builder
COPY --from=node_builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy Python runtime from builder
COPY --from=python_builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy application code
COPY . .

RUN chmod +x start.sh

EXPOSE 5000 8000

CMD ["./start.sh"]
