// server/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import { generateToken } from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, mobile, password, age } = req.body;

    // Check if user exists
    const userExists = await query(
      'SELECT * FROM users WHERE email = $1 OR mobile = $2',
      [email, mobile]
    );

    if (userExists.rows.length > 0) {
      res.status(400).json({
        error: 'User already exists with this email or mobile number'
      });
      return ;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await query(
      `INSERT INTO users (first_name, last_name, email, mobile, password_hash, age)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, first_name, last_name, email, mobile`,
      [firstName, lastName, email, mobile, hashedPassword, age]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailOrMobile, password } = req.body;

    // Find user by email or mobile
    const result = await query(
      'SELECT * FROM users WHERE email = $1 OR mobile = $1',
      [emailOrMobile]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return ;
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return ;
    }

    // Generate token
    const token = generateToken(user.id);

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        mobile: user.mobile
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Implement other controller methods
export const googleLogin = async (req: Request, res: Response) => {
  // Implement Google login logic
};

export const verifyEmail = async (req: Request, res: Response) => {
  // Implement email verification logic
};

export const verifyMobile = async (req: Request, res: Response) => {
  // Implement mobile verification logic
};

export const sendOTP = async (req: Request, res: Response) => {
  // Implement OTP sending logic
};

export const verifyOTP = async (req: Request, res: Response) => {
  // Implement OTP verification logic
};