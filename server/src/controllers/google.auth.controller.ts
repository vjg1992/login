// src/controllers/google.auth.controller.ts
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../config/db';
import { generateToken } from '../utils/jwt';

// Verify environment variables
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;

if (!googleClientId || !googleClientSecret || !googleCallbackUrl) {
    console.error('Missing required Google OAuth environment variables:');
    console.error('GOOGLE_CLIENT_ID:', !!googleClientId);
    console.error('GOOGLE_CLIENT_SECRET:', !!googleClientSecret);
    console.error('GOOGLE_CALLBACK_URL:', !!googleCallbackUrl);
    throw new Error('Missing required Google OAuth environment variables');
}

// Log environment variables for debugging
console.log('Environment variables check:');
console.log('CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);

const REDIRECT_URI = 'http://localhost:5000/api/auth/google/callback';

const client = new OAuth2Client({
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    redirectUri: googleCallbackUrl
});

export const googleLogin = (req: Request, res: Response) => {
    try {
        console.log('Initiating Google OAuth flow...');
        const authUrl = client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
            prompt: 'consent',
            redirect_uri: REDIRECT_URI
        });
        console.log('Redirecting to Google auth URL:', authUrl);
        res.redirect(authUrl);
    } catch (error) {
        console.error('Error in googleLogin:', error);
        res.redirect(`${process.env.CLIENT_URL}/auth/error?error=oauth_init_failed`);
    }
};

export const googleCallback = async (req: Request, res: Response) => {
    try {
        console.log('Received Google callback with code:', !!req.query.code);
        
        if (!req.query.code) {
            throw new Error('No authorization code received from Google');
        }

        // Get tokens from Google
        const code = req.query.code as string;
        console.log('Getting tokens from Google...');
        const { tokens } = await client.getToken(code);
        console.log('Received tokens:', !!tokens);

        if (!tokens.id_token) {
            throw new Error('No ID token received from Google');
        }

        console.log('Verifying ID token...');
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: googleClientId
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('No payload from Google');
        }
        console.log('Got user payload:', payload.email);

        // Check if user exists
        let result = await query(
            'SELECT * FROM users WHERE google_id = $1 OR email = $2',
            [payload.sub, payload.email]
        );

        let user;
        if (result.rows.length === 0) {
            console.log('Creating new user for:', payload.email);
            result = await query(
                `INSERT INTO users 
                (first_name, last_name, email, google_id, is_email_verified, is_google_auth)
                VALUES ($1, $2, $3, $4, true, true)
                RETURNING *`,
                [
                    payload.given_name || '',
                    payload.family_name || '',
                    payload.email,
                    payload.sub
                ]
            );
            user = result.rows[0];
        } else {
            user = result.rows[0];
            if (!user.google_id) {
                console.log('Updating existing user with Google ID:', payload.email);
                await query(
                    'UPDATE users SET google_id = $1, is_google_auth = true WHERE id = $2',
                    [payload.sub, user.id]
                );
            }
        }

        // Generate JWT token
        console.log('Generating JWT token for user:', user.email);
        const token = generateToken(user.id);

        // Redirect to frontend
        const redirectUrl = new URL('/auth/success', process.env.CLIENT_URL || 'http://localhost:3000');
        redirectUrl.searchParams.set('token', token);
        redirectUrl.searchParams.set('user', JSON.stringify({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email
        }));

        console.log('Redirecting to frontend success page');
        res.redirect(redirectUrl.toString());

    } catch (error) {
        console.error('Google callback error:', error);
        const errorUrl = new URL('/auth/error', process.env.CLIENT_URL || 'http://localhost:3000');
        errorUrl.searchParams.set('error', 'google_auth_failed');
        res.redirect(errorUrl.toString());
    }
};