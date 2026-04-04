# ── Janani Backend: Node.js + Python in a single container ──
FROM python:3.11-slim

# Install Node.js 20, FFmpeg, and curl
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ffmpeg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python dependencies ──
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# ── Node.js dependencies ──
COPY package*.json ./
RUN npm install --production

# ── Application code ──
COPY . .

# Create TTS audio directory
RUN mkdir -p public/tts

# Make startup script executable
RUN chmod +x start.sh

EXPOSE 5000 8000

CMD ["./start.sh"]
