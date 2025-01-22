// src/controllers/google.controller.ts
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../config/db';
import { generateToken } from '../utils/jwt';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL,
);

export const googleAuth = (req: Request, res: Response) => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile']
  });
  res.redirect(authUrl);
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    
    // Get tokens
    const { tokens } = await client.getToken(code as string);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('No payload from Google');

    // Check if user exists
    let result = await query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [payload.sub, payload.email]
    );

    let user;
    if (result.rows.length === 0) {
      // Create new user
      result = await query(
        `INSERT INTO users (
          first_name, last_name, email, google_id, 
          is_email_verified, is_google_auth
        ) VALUES ($1, $2, $3, $4, true, true) RETURNING *`,
        [
          payload.given_name,
          payload.family_name,
          payload.email,
          payload.sub
        ]
      );
      user = result.rows[0];
    } else {
      user = result.rows[0];
      // Update Google ID if not set
      if (!user.google_id) {
        await query(
          'UPDATE users SET google_id = $1, is_google_auth = true WHERE id = $2',
          [payload.sub, user.id]
        );
      }
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/login/success?token=${token}`);

  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login/error`);
  }
};