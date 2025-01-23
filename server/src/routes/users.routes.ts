// src/routes/users.routes.ts
import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public route for testing
router.get('/test', (req, res) => {
    res.json({ message: 'Users route is working' });
});

// Get current user's profile (protected route)
router.get('/me', authenticateToken, usersController.getUserDetails);


// Get all users (protected route)
router.get('/', authenticateToken, usersController.getAllUsers as any);

// Get user by ID (protected route)
router.get('/:id', authenticateToken, usersController.getUserById as any);


export default router;