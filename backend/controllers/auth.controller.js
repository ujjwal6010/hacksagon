import * as authService from '../services/auth.service.js';

/**
 * POST /api/auth/signup
 */
export async function signupController(req, res) {
  try {
    const { name, email, phoneNumber, password } = req.body;

    const result = await authService.signup({
      name,
      email,
      phoneNumber,
      password,
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.status === 409) {
      return res.status(409).json({ error: error.message });
    }

    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/login
 */
export async function loginController(req, res) {
  try {
    const { identifier, password } = req.body;

    const result = await authService.login(identifier, password);

    res.status(200).json(result);
  } catch (error) {
    if (error.status === 401) {
      return res.status(401).json({ error: error.message });
    }

    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
