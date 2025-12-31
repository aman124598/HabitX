import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../models/User';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt';
import { createError } from './errorHandler';

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const decoded: JWTPayload = verifyToken(token);

    // Verify user still exists
    const user = await UserRepository.findById(decoded.id);
    if (!user) {
      throw createError('User not found', 401);
    }

    // Add user to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    next();
  } catch (error: any) {
    const statusCode = error.statusCode || 401;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Authentication failed',
    });
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const token = extractTokenFromHeader(authHeader);
    const decoded: JWTPayload = verifyToken(token);

    // Verify user still exists
    const user = await UserRepository.findById(decoded.id);
    if (user) {
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on error, just continue without user
    next();
  }
};
