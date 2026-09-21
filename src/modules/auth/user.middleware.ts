import { NextFunction, Request, Response } from 'express';
import UserModel from './user.model';
import AppError from '../../utils/appError';
import catchAsync from '../../utils/catchAsync';
import { verifyAccessToken } from '../../utils/jwt';
import { IUser } from './user.interface';

const authMiddleware = catchAsync(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'You are not logged in! Please log in to get access.');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw new AppError(401, 'Invalid or expired token. Please log in again.');
    }

    if (typeof decoded === 'string' || !decoded.id) {
      throw new AppError(401, 'Invalid or expired token. Please log in again.');
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new AppError(401, 'The user belonging to this token no longer exists.');
    }

    req.user = user;
    next();
  }
);

const restrictTo =
  (...roles: IUser['role'][]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError(403, 'You do not have permission to perform this action'));
      return;
    }
    next();
  };

export { authMiddleware, restrictTo };
