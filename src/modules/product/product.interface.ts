import { Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  category: Types.ObjectId;
  price: number;
  discount: number;
  stock: number;
  productImage: string;
  productImagePublicId?: string;
}
