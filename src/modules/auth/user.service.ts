import crypto from 'crypto';
import UserModel from './user.model';
import AppError from '../../utils/appError';
import { IUser } from './user.interface';
import { sendVerificationEmail } from '../email/email.service';
import { env } from '../../config/env';
import { loginAccessToken, loginRefreshToken } from '../../utils/jwt';

const VERIFICATION_TOKEN_EXPIRES_IN_MINUTES = 10;
const VERIFICATION_TOKEN_EXPIRES_IN_MS =
  VERIFICATION_TOKEN_EXPIRES_IN_MINUTES * 60 * 1000;

const generateVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRES_IN_MS);

  return { rawToken, hashedToken, expiresAt };
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

    user.password = undefined as unknown as string;
    user.isVerificationToken = undefined;
    user.isVerificationExpires = undefined;
    return user;
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

  user.password = undefined as unknown as string;
  user.isVerificationToken = undefined;
  user.isVerificationExpires = undefined;

  return { user, accessToken, refreshToken };
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

export { registerService, resendVerificationService, loginService };
