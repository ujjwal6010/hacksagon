import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';

function createServiceError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizePhoneNumber(value) {
  if (!value || typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const hasPlusPrefix = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly) {
    return undefined;
  }

  return hasPlusPrefix ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Hash plain password using bcrypt
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password with hashed password
 */
async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate JWT token
 */
function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
}

/**
 * Format user response (exclude passwordHash)
 */
function formatUserResponse(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
  };
}

/**
 * SIGNUP SERVICE
 *
 * Validates input, checks uniqueness, hashes password, saves user, returns token + user
 */
export async function signup(payload) {
  const { name, email, phoneNumber, password } = payload;
  const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  // Validation: name required
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw createServiceError('Name is required', 400);
  }

  // Validation: at least one of email or phoneNumber
  if (!normalizedEmail && !normalizedPhoneNumber) {
    throw createServiceError('At least one of email or phoneNumber is required', 400);
  }

  // Validation: password minimum 6 characters
  if (!password || password.length < 6) {
    throw createServiceError('Password must be at least 6 characters', 400);
  }

  // Validation: check email uniqueness if provided
  if (normalizedEmail) {
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      throw createServiceError('Email already in use', 409);
    }
  }

  // Validation: check phoneNumber uniqueness if provided
  if (normalizedPhoneNumber) {
    const existingPhone = await User.findOne({ phoneNumber: normalizedPhoneNumber });
    if (existingPhone) {
      throw createServiceError('Phone number already in use', 409);
    }
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create and save user
  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    phoneNumber: normalizedPhoneNumber,
    passwordHash,
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  return {
    token,
    user: formatUserResponse(user),
  };
}

/**
 * LOGIN SERVICE
 *
 * Finds user by email or phone, validates password, returns token + user
 */
export async function login(identifier, password) {
  const normalizedIdentifier = identifier?.trim();
  const normalizedPhoneIdentifier = normalizePhoneNumber(identifier);

  // Validation: identifier and password required
  if (!normalizedIdentifier) {
    throw createServiceError('Identifier (email or phone) is required', 400);
  }

  if (!password || typeof password !== 'string') {
    throw createServiceError('Password is required', 400);
  }

  // Find user by email or phoneNumber
  const user = await User.findOne({
    $or: [
      { email: normalizedIdentifier.toLowerCase() },
      { phoneNumber: normalizedPhoneIdentifier || normalizedIdentifier },
    ],
  }).select('+passwordHash');

  if (!user) {
    throw createServiceError('Invalid identifier or password', 401);
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw createServiceError('Invalid identifier or password', 401);
  }

  // Generate token
  const token = generateToken(user._id);

  return {
    token,
    user: formatUserResponse(user),
  };
}
