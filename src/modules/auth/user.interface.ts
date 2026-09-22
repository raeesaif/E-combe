import { Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'customer' | 'seller' | 'admin';
  storeName?: string;
  description?: string;
  isVerified: boolean;
  isVerificationToken?: string;
  isVerificationExpires?: Date;
  resetPasswordTokenHash?: string;
  resetPasswordTokenExpiry?: Date;
  isPasswordMatch(password: string): Promise<boolean>;
}
