// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return ;
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    console.log('req.userId:', req.userId);
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
    return ;
  }
};

export const validateRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
) : void => {
  const { firstName, lastName, email, mobile } = req.body;

  if (!firstName || !lastName || !email || !mobile) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  // Basic mobile validation (10 digits)
  const mobileRegex = /^\d{10}$/;
  if (!mobileRegex.test(mobile)) {
    res.status(400).json({ error: 'Invalid mobile number format' });
    return;
  }

  next();
};