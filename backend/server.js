require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const authRoutes = require('./routes/auth');
const voiceRoutes = require('./routes/voice');
const inboundRoutes = require('./routes/inbound');
const dashboardRoutes = require('./routes/dashboard');
const { initSummaryCron } = require('./services/summaryCron');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const DB_NAME = process.env.DB_NAME || 'janani';

function wildcardToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) {
    return true;
  }

  let hostname = '';
  try {
    hostname = new URL(origin).hostname;
  } catch (error) {
    return false;
  }

  if (hostname.endsWith('.vercel.app')) {
    return true;
  }

  return allowedOrigins.some((allowed) => {
    if (!allowed.includes('*')) {
      return allowed.toLowerCase() === origin.toLowerCase();
    }
    return wildcardToRegExp(allowed).test(origin);
  });
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin, allowedOrigins)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  const stamp = new Date().toISOString();
  console.log(`[${stamp}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    service: 'node-backend',
    databaseMode: 'atlas',
    time: new Date().toISOString(),
  });
});

app.get('/api/ai-health', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:8000/docs', { timeout: 5000 });
    return res.status(200).json({
      status: 'ok',
      service: 'python-ai',
      python_status: response.status,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Python service unreachable',
      error: error.message,
    });
  }
});

app.post('/api/ask', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:8000/ask', req.body, { timeout: 180000 });
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(502).json({
      message: 'AI Service Error - Python RAG service may still be starting up',
      error: error.message,
      details: error.response?.data || null,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/inbound', inboundRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    return next(error);
  }
  return res.status(500).json({
    message: 'Internal server error',
    error: error.message,
  });
});

async function bootstrap() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: DB_NAME });
    console.log(`MongoDB connected (db: ${DB_NAME})`);

    initSummaryCron();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  try {
    await mongoose.disconnect();
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

bootstrap();
