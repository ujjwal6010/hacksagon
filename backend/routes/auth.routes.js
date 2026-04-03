import express from 'express';
import {
  signupController,
  loginController,
} from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * POST /api/auth/signup
 */
router.post('/signup', signupController);

/**
 * POST /api/auth/login
 */
router.post('/login', loginController);

export default router;
