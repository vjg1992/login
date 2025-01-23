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
  console.log('Auth header:', authHeader); 
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Extracted token:', token); 

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return ;
  }

  try {
    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded);
    req.userId = decoded.userId;
    console.log('req.userId:', req.userId);
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ error: 'Invalid token' });
    return ;
  }
};

export const validateRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
) : void => {
  const { 
    firstName, 
    lastName, 
    email, 
    mobile,
    age,
    location,
    address
  } = req.body;

  // Check required fields
  if (!firstName || !lastName || !email || !mobile) {
    res.status(400).json({ error: 'Required fields are missing' });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  // Validate mobile number (assuming Indian format)
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(mobile)) {
    res.status(400).json({ error: 'Invalid mobile number format' });
    return;
  }

  // Validate age
  if (age && (age < 18 || age > 100)) {
    res.status(400).json({ error: 'Age must be between 18 and 100' });
    return;
  }

  // Validate address if provided
  if (address) {
    const { pincode } = address;
    if (pincode && !/^\d{6}$/.test(pincode)) {
      res.status(400).json({ error: 'Invalid pincode format' });
      return;
    }
  }

  next();
};