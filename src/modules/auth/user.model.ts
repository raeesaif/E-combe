import bcrypt from 'bcryptjs';
import { model, Schema } from 'mongoose';
import { IUser } from './user.interface';

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'seller', 'admin'],
      default: 'customer',
    },
    storeName: {
      type: String,
      required: [
        function (this: IUser) {
          return this.role === 'seller';
        },
        'Store name is required for sellers',
      ],
    },
    description: {
      type: String,
      required: [
        function (this: IUser) {
          return this.role === 'seller';
        },
        'Description is required for sellers',
      ],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isVerificationToekn: {
      type: String,
      select: false,
    },
    isVerificationExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});

export default model<IUser>('User', userSchema);
