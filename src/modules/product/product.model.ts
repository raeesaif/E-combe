import { model, Schema } from 'mongoose';
import { IProduct } from './product.interface';

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trime: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trime: true,
  },
  category: {
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  price: {
    type: Number,
  },
});
