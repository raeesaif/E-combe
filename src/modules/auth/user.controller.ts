import {
  registerService,
  verifyEmailService,
  resendVerificationService,
  loginService,
  forgetPassword,
  resetPassword,
  getMeService,
  logoutService,
updateProfileService,
updatePasswordService
} from './user.service';
import { Request, Response } from 'express';
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

const getMeController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(
        401,
        'You are not logged in! Please log in to get access.'
      );
    }
    const user = await getMeService(String(req.user._id));
    apiResponse.success(res, user, 'User data retrieved successfully.', 200);
  }
);

const updateProfileController = catchAsync(
    async(req:Request , res:Response):Promise<void> =>{
        if(!req.user){
            throw new AppError(401, 'You are not logged in! Please log in to get access.');
        }
        const user = await updateProfileService(String(req.user._id), req.body.firstName, req.body.lastName);
        apiResponse.success(res, user, 'Profile updated successfully.', 200);
    }
)

const updatePasswordController = catchAsync(
    async(req:Request , res:Response):Promise<void> =>{
        if(!req.user){
            throw new AppError(401, 'You are not logged in! Please log in to get access.');
        }
        const user = await updatePasswordService(String(req.user._id), req.body.currentPassword, req.body.newPassword);
        apiResponse.success(res, null, 'Password updated successfully.', 200);
    }
)

const logoutController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(
        401,
        'You are not logged in! Please log in to get access.'
      );
    }
    await logoutService(String(req.user._id));
    apiResponse.success(
      res,
      null,
      'You have been logged out successfully.',
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
  getMeController,
  updateProfileController,
  updatePasswordController,
  logoutController,
};
