import { Document, Types } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  customer: Types.ObjectId;
  items: ICartItem[];
}
