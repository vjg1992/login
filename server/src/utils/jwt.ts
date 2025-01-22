// server/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

const JWT_SECRET = process.env.JWT_SECRET || 'jwtsecret';

// Test if JWT_SECRET is properly set
console.log('JWT_SECRET is', JWT_SECRET ? 'set' : 'not set');

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};