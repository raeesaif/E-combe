import { IUser } from '../modules/auth/user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
