import { Request, Response, NextFunction } from 'express';
import { UserRepository, IUser } from '../models/User';
import { ClerkExpressRequireAuth, ClerkExpressWithAuth, StrictAuthProp, LooseAuthProp } from '@clerk/clerk-sdk-node';

declare global {
  namespace Express {
    interface Request extends StrictAuthProp {}
  }
}

// Ensure the request has a valid Clerk session
const requireClerkAuth = ClerkExpressRequireAuth();

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  requireClerkAuth(req, res, async (err) => {
    if (err) {
      return res.status(401).json({ success: false, error: 'Unauthenticated' });
    }
    
    try {
      const clerkUserId = req.auth.userId;
      
      // We look up the MongoDB user using the newly added clerkUserId/firebaseUid column.
      let user = await UserRepository.findByFirebaseUid(clerkUserId);
      
      if (!user) {
        // Auto-create user from Clerk SDK
        const { users } = require('@clerk/clerk-sdk-node');
        try {
          const clerkUser = await users.getUser(clerkUserId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          const username = clerkUser.username || email?.split('@')[0] || `user_${clerkUserId.substring(0,6)}`;
          
          let uniqueUsername = username;
          let counter = 1;
          while (await UserRepository.findByUsername(uniqueUsername)) {
            uniqueUsername = `${username}${counter}`;
            counter++;
          }
          
          const userPayload: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = {
            username: uniqueUsername,
            email: email || '',
            emailVerified: true,
            firebaseUid: clerkUserId,
            totalXP: 0,
            level: 1,
            isPublic: true,
          };
          
          user = await UserRepository.create(userPayload);
        } catch (autoCreateErr) {
          console.error("Auto-create user failed:", autoCreateErr);
          return res.status(500).json({ success: false, error: 'Failed to sync user with database' });
        }
      }

      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      next();
    } catch (dbError) {
       return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });
};

const withClerkAuth = ClerkExpressWithAuth();

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  withClerkAuth(req, res, async (err) => {
    if (err || !req.auth?.userId) {
      return next();
    }
    
    try {
      const clerkUserId = req.auth.userId;
      let user = await UserRepository.findByFirebaseUid(clerkUserId);
      
      if (!user) {
        const { users } = require('@clerk/clerk-sdk-node');
        try {
          const clerkUser = await users.getUser(clerkUserId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          const username = clerkUser.username || email?.split('@')[0] || `user_${clerkUserId.substring(0,6)}`;
          
          let uniqueUsername = username;
          let counter = 1;
          while (await UserRepository.findByUsername(uniqueUsername)) {
            uniqueUsername = `${username}${counter}`;
            counter++;
          }
          
          const userPayload: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = {
            username: uniqueUsername,
            email: email || '',
            emailVerified: true,
            firebaseUid: clerkUserId,
            totalXP: 0,
            level: 1,
            isPublic: true,
          };
          user = await UserRepository.create(userPayload);
        } catch (e) {
          // just swallow error for optional auth
        }
      }
      
      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
        };
      }
      next();
    } catch (e) {
      next();
    }
  });
};
