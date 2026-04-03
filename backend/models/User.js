import mongoose from 'mongoose';

/**
 * User Schema (Normalized)
 * 
 * Represents an authenticated user.
 * At least one of email or phoneNumber is required.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^[+\d\s\-()]+$/.test(v) && v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15;
        },
        message: 'Phone number must contain only digits, +, -, spaces, or parentheses, and be 7-15 digits long',
      },
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-validation hook: Ensure at least one of email or phoneNumber
 */
userSchema.pre('validate', function (next) {
  if (!this.email && !this.phoneNumber) {
    this.invalidate('email', 'At least one of email or phoneNumber is required');
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
