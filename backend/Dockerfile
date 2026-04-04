# ── Janani Backend: Node 20 base + Python 3 via apt ──
FROM node:20-slim

# Install Python 3 + pip + FFmpeg (all via apt, no curl pipes)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv ffmpeg curl && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Node.js dependencies
COPY package*.json ./
RUN npm install --production

# Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

# Application code
COPY . .

RUN mkdir -p public/tts && chmod +x start.sh

EXPOSE 5000 8000

CMD ["./start.sh"]
