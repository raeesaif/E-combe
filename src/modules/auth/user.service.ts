import UserModel from './user.model';
import AppError from '../../utils/appError';
import { IUser } from './user.interface';

const registerService = async (userData: Partial<IUser>): Promise<IUser> => {
  const existingUser = await UserModel.findOne({ email: userData.email });
  if (existingUser) {
    throw new AppError(400, 'Email already exists');
  }

  try {
    const user = await UserModel.create(userData);
    user.password = undefined as unknown as string;
    return user;
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(400, 'Email already exists');
    }
    throw error;
  }
};

export { registerService };
