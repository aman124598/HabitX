import { Request, Response, NextFunction } from 'express';
import { UserRepository, IUser } from '../models/User';
import { ClerkExpressRequireAuth, ClerkExpressWithAuth, StrictAuthProp, clerkClient } from '@clerk/clerk-sdk-node';

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

      // Find user by Clerk ID
      let user = await UserRepository.findByClerkId(clerkUserId);

      if (!user) {
        try {
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          const username = clerkUser.username || 
                          clerkUser.firstName || 
                          email?.split('@')[0] || 
                          `user_${clerkUserId.substring(0, 6)}`;

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
            clerkId: clerkUserId,
            totalXP: 0,
            level: 1,
            isPublic: true,
          };

          user = await UserRepository.create(userPayload);
          console.log(`✅ Auto-created user record for Clerk ID: ${clerkUserId}`);
        } catch (autoCreateErr) {
          console.error('Auto-create user failed:', autoCreateErr);
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
      let user = await UserRepository.findByClerkId(clerkUserId);

      if (!user) {
        try {
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          const username = clerkUser.username || 
                          clerkUser.firstName || 
                          email?.split('@')[0] || 
                          `user_${clerkUserId.substring(0, 6)}`;

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
            clerkId: clerkUserId,
            totalXP: 0,
            level: 1,
            isPublic: true,
          };
          user = await UserRepository.create(userPayload);
        } catch (e) {
          // swallow error for optional auth
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
