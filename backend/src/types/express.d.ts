import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        _id?: string;
        username: string;
        email: string;
      };
    }
  }
}

export interface AuthRequest extends Request {
  user: {
    id: string;
    _id?: string;
    username: string;
    email: string;
  };
}
