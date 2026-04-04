# ── Stage 1: Install Node.js dependencies ──
FROM node:20-slim AS node-deps
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# ── Stage 2: Install Python dependencies ──
FROM python:3.11-slim AS py-deps
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 3: Final image ──
FROM python:3.11-slim

# Install Node.js from official binary (no curl|bash needed)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ffmpeg && \
    curl -fsSL https://nodejs.org/dist/v20.18.0/node-v20.18.0-linux-x64.tar.xz | tar -xJ -C /usr/local --strip-components=1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python packages from py-deps stage
COPY --from=py-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=py-deps /usr/local/bin /usr/local/bin

# Copy Node modules from node-deps stage
COPY --from=node-deps /app/node_modules ./node_modules

# Copy application code
COPY . .

RUN mkdir -p public/tts && chmod +x start.sh

EXPOSE 5000 8000

CMD ["./start.sh"]
