// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { query } from '../config/db';
import { generateToken } from '../utils/jwt';
import { sendSMS } from '../services/sns.service';
import nodemailer from 'nodemailer';

// export const login = async (req: Request, res: Response) => {
//   try {
//     const { emailOrMobile, password } = req.body;
//     console.log('\n=== Login Attempt ===');
//     console.log('Email/Mobile:', emailOrMobile);
//     console.log('Password:', password);

//     // Validate input
//     if (!emailOrMobile || !password) {
//       return res.status(400).json({
//         success: false,
//         error: 'Email/Mobile and password are required'
//       });
//     }

//     // Modified query to use password directly instead of password_hash
//     const queryText = `
//       SELECT * FROM users 
//       WHERE (email = $1 OR mobile = $1)
//       AND password_hash = $2
//     `;

//     const result = await query(queryText, [emailOrMobile, password]);
//     console.log('Query result rows:', result.rowCount);

//     if (result.rows.length === 0) {
//       return res.status(401).json({
//         success: false,
//         error: 'Invalid credentials'
//       });
//     }

//     const user = result.rows[0];
//     console.log('Login successful for user:', user.email);

//     // Generate token
//     const token = generateToken(user.id);

//     // Update last login
//     await query(
//       'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
//       [user.id]
//     );

//     // Send response
//     return res.status(200).json({
//       success: true,
//       data: {
//         user: {
//           id: user.id,
//           firstName: user.first_name,
//           lastName: user.last_name,
//           email: user.email,
//           mobile: user.mobile
//         },
//         token
//       }
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// };

// auth.controller.ts - Update the login function
export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrMobile, password } = req.body;
    
    // First find user without checking password
    const userQuery = `
      SELECT * FROM users 
      WHERE email = $1 OR mobile = $1
    `;
    const result = await query(userQuery, [emailOrMobile]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];
    
    // Compare plain password with stored hash
    if (user.password_hash !== password) { // Just for testing, we'll add bcrypt later
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          mobile: user.mobile
        }
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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSKEY
  },
});

async function sendEmailOTP(email: string, otp: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Login OTP',
      text: `Your OTP for login is: ${otp}`
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}


export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { type, value } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    if (type === 'email') {
      await sendEmailOTP(value, otp);
    } else if (type === 'mobile') {
      await sendSMS(value, `Your OTP is: ${otp}`);
    }

    await query(
      `INSERT INTO otps (user_id, otp_code, otp_type, expires_at)
       SELECT id, $1, $2, $3
       FROM users
       WHERE ${type === 'email' ? 'email' : 'mobile'} = $4`,
      [otp, type, expiresAt, value]
    );

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${value}`
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
    console.log('Verifying OTP:', { type, value, otp });

    const result = await query(
      `SELECT o.*, u.id as user_id
       FROM otps o
       JOIN users u ON u.id = o.user_id
       WHERE o.otp_code = $1
       AND o.otp_type = $2
       AND u.${type === 'email' ? 'email' : 'mobile'} = $3
       AND o.expires_at > CURRENT_TIMESTAMP
       AND o.is_verified = false
       ORDER BY o.created_at DESC
       LIMIT 1`,
      [otp, type, value]
    );

    console.log('Query result:', result.rows);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    // Mark OTP as verified
    await query(
      'UPDATE otps SET is_verified = true WHERE id = $1',
      [result.rows[0].id]
    );

    //verifyOTP function
    const userDetails = await query(
      'SELECT first_name, last_name, email FROM users WHERE id = $1',
      [result.rows[0].user_id]
    );

    // Generate JWT
    const token = generateToken(result.rows[0].user_id);

    return res.status(200).json({
      success: true,
      data: { token },
      user: userDetails.rows[0]
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(400).json({
        success: false,
        error: 'No token provided'
      });
      return;
    }

    // Optional: Invalidate the token in database
    await query(
      `UPDATE user_sessions 
       SET expires_at = CURRENT_TIMESTAMP 
       WHERE token = $1`,
      [token]
    );

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    }); return;
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    }); return;
  }
};