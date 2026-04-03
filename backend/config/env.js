import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

export const config = {
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGO_URI,
  pythonServiceUrl: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000',
  jwtSecret: process.env.JWT_SECRET,
};

export default config;
