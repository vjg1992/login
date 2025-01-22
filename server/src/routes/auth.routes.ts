// src/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
import { validateRegistration } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';
import * as googleController from '../controllers/google.controller';

const router = Router();

// Basic authentication routes
router.post('/login', authController.login as (req: Request, res: Response) => void);
router.post('/send-otp', authController.sendOTP as (req: Request, res: Response) => void);
router.post('/verify-otp', authController.verifyOTP as (req: Request, res: Response) => void);

// Google OAuth routes
router.get('/google', (req, res) => googleController.googleAuth(req, res));
router.get('/google/callback', (req, res) => googleController.googleCallback(req, res));

export default router;