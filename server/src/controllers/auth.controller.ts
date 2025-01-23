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


// In auth.controller.ts

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { type, value } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // First, check if user exists
    let userResult = await query(
      `SELECT id FROM users WHERE ${type === 'email' ? 'email' : 'mobile'} = $1`,
      [value]
    );

    let userId;
    if (userResult.rows.length === 0) {
      // Create new user with minimal information
      const newUserResult = await query(
        `INSERT INTO users (
          ${type === 'email' ? 'email' : 'mobile'},
          created_at
        ) VALUES ($1, CURRENT_TIMESTAMP) RETURNING id`,
        [value]
      );
      userId = newUserResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Send OTP based on type
    if (type === 'email') {
      await sendEmailOTP(value, otp);
    } else if (type === 'mobile') {
      await sendSMS(value, `Your OTP is: ${otp}`);
    }

    // Store OTP
    await query(
      `INSERT INTO otps (
        user_id,
        otp_code,
        otp_type,
        expires_at
      ) VALUES ($1, $2, $3, $4)`,
      [userId, otp, type, expiresAt]
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

    // Modified query to handle new user structure
    const result = await query(
      `SELECT o.*, u.id as user_id, u.first_name, u.last_name, u.email, u.mobile
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

    // Update user verification status
    await query(
      `UPDATE users 
       SET ${type === 'email' ? 'is_email_verified' : 'is_mobile_verified'} = true 
       WHERE id = $1`,
      [result.rows[0].user_id]
    );

    // Generate JWT
    const token = generateToken(result.rows[0].user_id);

    // Return minimal user details
    return res.status(200).json({
      success: true,
      data: { 
        token,
        user: {
          id: result.rows[0].user_id,
          email: result.rows[0].email,
          mobile: result.rows[0].mobile,
          firstName: result.rows[0].first_name,
          lastName: result.rows[0].last_name,
          isEmailVerified: type === 'email' ? true : undefined,
          isMobileVerified: type === 'mobile' ? true : undefined
        }
      }
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


export const sendRegistrationOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, value } = req.body;
    
    // First check if user already exists
    const existingUser = await query(
      `SELECT id FROM users WHERE ${type === 'email' ? 'email' : 'mobile'} = $1`,
      [value]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({
        success: false,
        error: `User with this ${type} already exists`
      });return;
    };

     // Delete any existing OTPs for this identifier
     await query(
      'DELETE FROM registration_otps WHERE identifier = $1 AND identifier_type = $2',
      [value, type]
    );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Send OTP via email or SMS
    if (type === 'email') {
      await sendEmailOTP(value, otp);
    } else if (type === 'mobile') {
      await sendSMS(value, `Your OTP is: ${otp}`);
      console.log('SMS sent successfully from sendRegistrationOTP to mobile:', value);
    }

    // Store OTP in registration_otps table
    await query(
      `INSERT INTO registration_otps (
        identifier, 
        identifier_type, 
        otp_code, 
        expires_at
      ) VALUES ($1, $2, $3, $4)`,
      [value, type, otp, expiresAt]
    );

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${value}`
    });return;
  } catch (error) {
    console.error('Send registration OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });return;
  }
};

export const verifyRegistrationOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, value, otp } = req.body;

    const result = await query(
      `SELECT * FROM registration_otps 
       WHERE identifier = $1 
       AND identifier_type = $2 
       AND otp_code = $3
       AND expires_at > CURRENT_TIMESTAMP
       AND is_verified = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [value, type, otp]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired OTP'
      });return;
    }

    // Mark OTP as verified
    await query(
      'UPDATE registration_otps SET is_verified = true WHERE id = $1',
      [result.rows[0].id]
    );

    res.status(200).json({
      success: true,
      data: {
        verified: true,
        type,
        value
      }
    });return;
  } catch (error) {
    console.error('Verify registration OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });return;
  }
};

// Modify the register endpoint to verify both email and mobile are verified
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, mobile, age, location, address } = req.body;

    // Check if both email and mobile are verified
    const verifiedEmail = await query(
      `SELECT * FROM registration_otps 
       WHERE identifier = $1 
       AND identifier_type = 'email' 
       AND is_verified = true
       AND expires_at > CURRENT_TIMESTAMP`,
      [email]
    );

    const verifiedMobile = await query(
      `SELECT * FROM registration_otps 
       WHERE identifier = $1 
       AND identifier_type = 'mobile' 
       AND is_verified = true
       AND expires_at > CURRENT_TIMESTAMP`,
      [mobile]
    );

    if (verifiedEmail.rows.length === 0 || verifiedMobile.rows.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Both email and mobile must be verified before registration, please try again!'
      });return;
    }

    // Proceed with user creation
    const result = await query(
      `INSERT INTO users (
        first_name, 
        last_name, 
        email, 
        mobile, 
        age,
        location,
        address_area,
        address_city,
        address_state,
        address_pincode,
        is_email_verified,
        is_mobile_verified,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, true, CURRENT_TIMESTAMP)
      RETURNING id, first_name, last_name, email, mobile`,
      [
        firstName,
        lastName,
        email,
        mobile,
        age,
        location,
        address.area,
        address.city,
        address.state,
        address.pincode
      ]
    );

    // Generate token
    const token = generateToken(result.rows[0].id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: result.rows[0].id,
          firstName: result.rows[0].first_name,
          lastName: result.rows[0].last_name,
          email: result.rows[0].email,
          mobile: result.rows[0].mobile
        }
      }
    });return;
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });return;
  }
};