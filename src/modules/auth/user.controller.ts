import { registerService } from './user.service';
import { Request, Response, NextFunction } from 'express';
import AppError from '../../utils/appError';
import catchAsync from '../../utils/catchAsync';
import apiResponse from '../../utils/apiResponse';

const registerController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const register = await registerService(req.body);
    if (!register) {
      throw new AppError(400, 'Registration failed');
    }
    apiResponse.success(res, register, 'Registration successful. Please verify your email.', 201);
  }
);

export { registerController };
