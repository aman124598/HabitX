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

function getPreferredClerkEmail(clerkUser: any): string {
  if (!clerkUser) return '';

  const primaryEmailId = clerkUser.primaryEmailAddressId as string | undefined;
  if (primaryEmailId && Array.isArray(clerkUser.emailAddresses)) {
    const primary = clerkUser.emailAddresses.find((emailObj: any) => emailObj?.id === primaryEmailId);
    if (primary?.emailAddress) return String(primary.emailAddress);
  }

  if (Array.isArray(clerkUser.emailAddresses)) {
    const first = clerkUser.emailAddresses.find((emailObj: any) => !!emailObj?.emailAddress);
    if (first?.emailAddress) return String(first.emailAddress);
  }

  return '';
}

async function buildUniqueUsername(
  baseUsername: string,
  currentClerkUserId: string
): Promise<string> {
  const normalizedBase = (baseUsername || `user_${currentClerkUserId.substring(0, 6)}`).trim();
  let candidate = normalizedBase;
  let counter = 1;

  while (true) {
    const existing = await UserRepository.findByUsername(candidate);
    if (!existing || existing.clerkId === currentClerkUserId) {
      return candidate;
    }

    candidate = `${normalizedBase}${counter}`;
    counter++;
  }
}

async function syncUserFromClerk(clerkUserId: string, user: IUser | null): Promise<IUser> {
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email = getPreferredClerkEmail(clerkUser);
  const baseUsername =
    clerkUser.username ||
    clerkUser.firstName ||
    (email ? email.split('@')[0] : '') ||
    `user_${clerkUserId.substring(0, 6)}`;

  if (!user) {
    const uniqueUsername = await buildUniqueUsername(baseUsername, clerkUserId);
    const userPayload: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = {
      username: uniqueUsername,
      email: email || '',
      emailVerified: true,
      clerkId: clerkUserId,
      totalXP: 0,
      level: 1,
      isPublic: true,
    };

    const createdUser = await UserRepository.create(userPayload);
    console.log(`✅ Auto-created user record for Clerk ID: ${clerkUserId}`);
    return createdUser;
  }

  const needsUsernameRepair = !user.username || user.username.startsWith('user_');
  const needsEmailRepair = !user.email;

  if (!needsUsernameRepair && !needsEmailRepair) {
    return user;
  }

  const updates: Partial<IUser> = {};
  if (needsUsernameRepair) {
    updates.username = await buildUniqueUsername(baseUsername, clerkUserId);
  }
  if (needsEmailRepair && email) {
    updates.email = email;
  }

  if (Object.keys(updates).length === 0) {
    return user;
  }

  const updated = await UserRepository.update(user.id, updates);
  if (!updated) {
    throw new Error('Failed to update user during Clerk sync');
  }

  console.log(`🔄 Healed user profile fields for Clerk ID: ${clerkUserId}`);
  return updated;
}

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

      let user = await UserRepository.findByClerkId(clerkUserId);
      user = await syncUserFromClerk(clerkUserId, user);

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

      try {
        user = await syncUserFromClerk(clerkUserId, user);
      } catch (e) {
        // swallow sync error for optional auth
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
