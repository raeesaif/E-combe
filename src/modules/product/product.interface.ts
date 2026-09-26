import { Document, Types } from 'mongoose';

export interface IProduct extends Document {
  productId: string;
  name: string;
  description: string;
  category: Types.ObjectId;
  seller: Types.ObjectId;
  price: number;
  discount: number;
  stock: number;
  productImage: string;
  productImagePublicId?: string;
}
