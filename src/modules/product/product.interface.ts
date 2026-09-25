import { Document } from 'mongoose';
import mongoose from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  category: mongoose.Types.ObjectId;
  price: number;
  discount: number;
  stock: number;
  productImage: string;
  productImagePublicId: string;
}
