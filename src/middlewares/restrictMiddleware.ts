import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';

export const restrictMiddleware = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      throw new AppError(
        403,
        'You do not have permission to perform this action'
      );
    }
    next();
  };
};
