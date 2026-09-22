import crypto from 'crypto';
import UserModel from './user.model';
import AppError from '../../utils/appError';
import { IUser } from './user.interface';
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from '../email/email.service';
import { env } from '../../config/env';
import { loginAccessToken, loginRefreshToken } from '../../utils/jwt';

const VERIFICATION_TOKEN_EXPIRES_IN_MINUTES = 10;
const RESET_PASSWORD_TOKEN_EXPIRES_IN_MINUTES = 10;

const generateSecureToken = (expiresInMinutes: number) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  return { rawToken, hashedToken, expiresAt };
};

const generateVerificationToken = () =>
  generateSecureToken(VERIFICATION_TOKEN_EXPIRES_IN_MINUTES);

const sanitizeUser = (user: IUser): IUser => {
  user.password = undefined as unknown as string;
  user.isVerificationToken = undefined;
  user.isVerificationExpires = undefined;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordTokenExpiry = undefined;
  return user;
};

const dispatchVerificationEmail = async (
  user: Pick<IUser, 'firstName' | 'lastName' | 'email'>,
  rawToken: string
): Promise<void> => {
  const verificationUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;

  try {
    await sendVerificationEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      verificationUrl,
      expiresInMinutes: VERIFICATION_TOKEN_EXPIRES_IN_MINUTES,
    });
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
  }
};

const dispatchResetPasswordEmail = async (
  user: Pick<IUser, 'firstName' | 'lastName' | 'email'>,
  rawToken: string
): Promise<void> => {
  const resetUrl = `${env.clientUrl}/reset-password?email=${encodeURIComponent(
    user.email
  )}&token=${encodeURIComponent(rawToken)}`;

  try {
    await sendResetPasswordEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      resetUrl,
    });
  } catch (emailError) {
    console.error('Failed to send reset password email:', emailError);
  }
};

const registerService = async (userData: Partial<IUser>): Promise<IUser> => {
  const existingUser = await UserModel.findOne({ email: userData.email });
  if (existingUser) {
    throw new AppError(400, 'Email already exists');
  }

  const { rawToken, hashedToken, expiresAt } = generateVerificationToken();

  try {
    const user = await UserModel.create({
      ...userData,
      isVerificationToken: hashedToken,
      isVerificationExpires: expiresAt,
    });

    await dispatchVerificationEmail(user, rawToken);

    return sanitizeUser(user);
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(400, 'Email already exists');
    }
    throw error;
  }
};

const loginService = async (
  email: string,
  password: string
): Promise<{ user: IUser; accessToken: string; refreshToken: string }> => {
  const user = await UserModel.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError(404, 'No account found with this email');
  }

  if (!user.isVerified) {
    throw new AppError(403, 'your email is not verified');
  }

  const isPasswordMatch = await user.isPasswordMatch(password);

  if (!isPasswordMatch) {
    throw new AppError(400, 'Invalid password');
  }

  const tokenPayload = { id: user._id.toString() };
  const accessToken = loginAccessToken(tokenPayload);
  const refreshToken = loginRefreshToken(tokenPayload);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

const forgetPassword = async (email: string): Promise<{ message: string }> => {
  const user = await UserModel.findOne({ email });

  const genericResponse = {
    message:
      'If an account exists with this email, you will receive a password reset link.',
  };

  if (!user) {
    return genericResponse;
  }

  const { rawToken, hashedToken, expiresAt } = generateSecureToken(
    RESET_PASSWORD_TOKEN_EXPIRES_IN_MINUTES
  );

  user.resetPasswordTokenHash = hashedToken;
  user.resetPasswordTokenExpiry = expiresAt;
  await user.save();

  await dispatchResetPasswordEmail(user, rawToken);

  return genericResponse;
};

const resetPassword = async (
  email: string,
  token: string,
  newPassword: string
): Promise<IUser> => {
  const user = await UserModel.findOne({ email }).select(
    '+resetPasswordTokenHash +resetPasswordTokenExpiry'
  );

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (!user.resetPasswordTokenHash || !user.resetPasswordTokenExpiry) {
    throw new AppError(400, 'Invalid reset token');
  }

  const hashedIncomingToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  if (hashedIncomingToken !== user.resetPasswordTokenHash) {
    throw new AppError(400, 'Invalid reset token');
  }

  if (user.resetPasswordTokenExpiry < new Date()) {
    throw new AppError(400, 'Reset token has expired');
  }

  user.password = newPassword;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordTokenExpiry = undefined;
  await user.save();

  return sanitizeUser(user);
};

const verifyEmailService = async (token: string): Promise<IUser> => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await UserModel.findOne({
    isVerificationToken: hashedToken,
  }).select('+isVerificationToken +isVerificationExpires');

  if (!user) {
    throw new AppError(400, 'Invalid verification token');
  }

  if (!user.isVerificationExpires || user.isVerificationExpires < new Date()) {
    throw new AppError(400, 'Verification link has expired');
  }

  user.isVerified = true;
  user.isVerificationToken = undefined;
  user.isVerificationExpires = undefined;
  await user.save();

  return sanitizeUser(user);
};

const resendVerificationService = async (email: string): Promise<void> => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new AppError(404, 'No account found with this email');
  }

  if (user.isVerified) {
    throw new AppError(400, 'This email is already verified');
  }

  const { rawToken, hashedToken, expiresAt } = generateVerificationToken();

  user.isVerificationToken = hashedToken;
  user.isVerificationExpires = expiresAt;
  await user.save();

  await dispatchVerificationEmail(user, rawToken);
};

export {
  registerService,
  verifyEmailService,
  resendVerificationService,
  loginService,
  forgetPassword,
  resetPassword,
};
