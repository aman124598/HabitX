import jwt from 'jsonwebtoken';

export interface JWTPayload {
  id: string;
  username: string;
  email: string;
}

export const generateToken = (user: { id: string; username: string; email: string }): string => {
  const payload: JWTPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const extractTokenFromHeader = (authHeader: string | undefined): string => {
  if (!authHeader) {
    throw new Error('Authorization header is required');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header must start with Bearer');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (!token) {
    throw new Error('Token is required');
  }

  return token;
};
