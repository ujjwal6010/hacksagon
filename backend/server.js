import express from 'express';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

const app = express();

/**
 * Middleware
 */
app.use(express.json());
app.use(express.static('public'));

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Initialize server
 */
async function start() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start HTTP server
    app.listen(config.port, () => {
      console.log(`✓ Janani Backend running on port ${config.port}`);
      console.log(`✓ Environment: ${config.environment}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
