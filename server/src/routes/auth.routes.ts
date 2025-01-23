// src/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
import { validateRegistration } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';
import * as googleController from '../controllers/google.controller';
import * as googleAuthController from '../controllers/google.auth.controller';
import { authenticateToken } from '../middleware/auth';


const router = Router();

// Basic authentication routes
router.post('/login', authController.login as (req: Request, res: Response) => void);
router.post('/send-otp', authController.sendOTP as (req: Request, res: Response) => void);
router.post('/verify-otp', authController.verifyOTP as (req: Request, res: Response) => void);
router.post('/logout', authenticateToken, authController.logout);

// Add new routes for registration OTP
router.post('/register/send-otp', authController.sendRegistrationOTP);
router.post('/register/verify-otp', authController.verifyRegistrationOTP);
router.post('/register', validateRegistration, authController.register);

// Google OAuth routes
router.get('/google', (req, res) => googleAuthController.googleLogin(req, res));
router.get('/google/callback', (req, res) => googleAuthController.googleCallback(req, res));

// Test route to check Google OAuth configuration
router.get('/google/test-config', (req, res) => {
    const config = {
        clientIdExists: !!process.env.GOOGLE_CLIENT_ID,
        clientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
        callbackUrlExists: !!process.env.GOOGLE_CALLBACK_URL,
        clientUrl: process.env.CLIENT_URL,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL
    };
    res.json(config);
});

router.get('/google/config', (req, res) => {
    const config = {
        clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
        redirectUri: 'http://localhost:5000/api/auth/google/callback',
        clientUrl: process.env.CLIENT_URL,
    };
    res.json(config);
});

export default router;