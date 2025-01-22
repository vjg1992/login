// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { query } from '../config/db';
import { generateToken } from '../utils/jwt';
import { sendSMS } from '../services/sns.service';

export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrMobile, password } = req.body;
    console.log('\n=== Login Attempt ===');
    console.log('Email/Mobile:', emailOrMobile);
    console.log('Password:', password);

    // Validate input
    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/Mobile and password are required'
      });
    }

    // Modified query to use password directly instead of password_hash
    const queryText = `
      SELECT * FROM users 
      WHERE (email = $1 OR mobile = $1)
      AND password_hash = $2
    `;

    const result = await query(queryText, [emailOrMobile, password]);
    console.log('Query result rows:', result.rowCount);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];
    console.log('Login successful for user:', user.email);

    // Generate token
    const token = generateToken(user.id);

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Send response
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          mobile: user.mobile
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { type, value } = req.body;

    // Validate input
    if (!type || !value) {
      return res.status(400).json({
        success: false,
        error: 'Type and value are required'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Save OTP
    const insertQuery = `
      INSERT INTO otps (user_id, otp_code, otp_type, expires_at)
      SELECT id, $1, $2, $3
      FROM users
      WHERE ${type === 'email' ? 'email' : 'mobile'} = $4
    `;

    await query(insertQuery, [otp, type, expiresAt, value]);

    // In production, send actual OTP via email/SMS
    console.log(`OTP for testing: ${otp}`);

    if (type === 'mobile') {
      // Send SMS
      await sendSMS(value, `Your OTP for login is: ${otp}`);
    } else {
      // For email, just log it (implement email sending later)
      console.log(`OTP for testing: ${otp}`);
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${type}`
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { type, value, otp } = req.body;

    // Validate input
    if (!type || !value || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Type, value and OTP are required'
      });
    }

    // Verify OTP
    const verifyQuery = `
      SELECT o.*, u.id as user_id
      FROM otps o
      JOIN users u ON u.id = o.user_id
      WHERE o.otp_code = $1
      AND o.otp_type = $2
      AND u.${type === 'email' ? 'email' : 'mobile'} = $3
      AND o.expires_at > CURRENT_TIMESTAMP
      AND o.is_verified = false
      ORDER BY o.created_at DESC
      LIMIT 1
    `;

    const result = await query(verifyQuery, [otp, type, value]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    const otpRecord = result.rows[0];

    // Mark OTP as verified
    await query(
      'UPDATE otps SET is_verified = true WHERE id = $1',
      [otpRecord.id]
    );

    // Generate token
    const token = generateToken(otpRecord.user_id);

    return res.status(200).json({
      success: true,
      data: { token }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};