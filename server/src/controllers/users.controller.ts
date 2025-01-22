// src/controllers/users.controller.ts
import { Request, Response } from 'express';
import { query } from '../config/db';

export const getUserDetails = async (req: Request, res: Response): Promise<void>  => {
  try {
    console.log('req.userId:', req.userId);
    // req.userId comes from auth middleware
    const result = await query(
      `SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        mobile,
        created_at,
        last_login,
        is_email_verified,
        is_mobile_verified,
        is_google_auth
      FROM users 
      WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
    return;
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user details',
      id : req.userId,
    });
    return;
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await query(
            'SELECT id, first_name, last_name, email, mobile, created_at FROM users',
            []
        );

        return res.status(200).json({
            success: true,
            data: result.rows,
            count: result.rowCount
        });
    } catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT id, first_name, last_name, email, mobile, created_at FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch user',
            id: req.params.id
        });
    }
};