import {
  registerService,
  resendVerificationService,
  loginService,
} from './user.service';
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
    apiResponse.success(
      res,
      register,
      'Registration successful. Please verify your email.',
      201
    );
  }
);

const loginController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await loginService(
      email,
      password
    );
    apiResponse.success(
      res,
      { user, accessToken, refreshToken },
      'Login successful.',
      200
    );
  }
);

const resendVerificationController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    await resendVerificationService(req.body.email);
    apiResponse.success(
      res,
      null,
      'Verification email resent. Please check your inbox.',
      200
    );
  }
);

export { registerController, loginController, resendVerificationController };
