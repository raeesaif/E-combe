import { Schema, model } from 'mongoose';
import { ICart } from './cart.interface';

const cartSchema = new Schema<ICart>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const CartModel = model<ICart>('Cart', cartSchema);

export default CartModel;
