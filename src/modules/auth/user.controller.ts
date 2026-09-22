import {
  registerService,
  verifyEmailService,
  resendVerificationService,
  loginService,
  forgetPassword,
  resetPassword,
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

const verifyEmailController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const user = await verifyEmailService(req.body.token);
    apiResponse.success(res, user, 'Email verified successfully.', 200);
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

const forgotPasswordController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { message } = await forgetPassword(req.body.email);
    apiResponse.success(res, null, message, 200);
  }
);

const resetPasswordController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { email, token, newPassword } = req.body;
    await resetPassword(email, token, newPassword);
    apiResponse.success(
      res,
      null,
      'Your password has been reset successfully. Please log in with your new password.',
      200
    );
  }
);

export {
  registerController,
  loginController,
  verifyEmailController,
  resendVerificationController,
  forgotPasswordController,
  resetPasswordController,
};
