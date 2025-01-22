// server/src/routes/auth.routes.ts
import { Router } from 'express';
import { validateRegistration } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Authentication routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', authController.login);
router.post('/login/google', authController.googleLogin);
router.post('/verify-email', authController.verifyEmail);
router.post('/verify-mobile', authController.verifyMobile);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);

export default router;