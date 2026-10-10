import { model, Schema } from 'mongoose';
import { IOrder } from './order.interface';

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        seller: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        name: { type: String, required: true },
        image: { type: String },
        unitPrice: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        status: {
          type: String,
          enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          default: 'pending',
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    stripeSessionId: {
      type: String,
      index: true,
    },
    fromCart: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ 'items.seller': 1, createdAt: -1 });

const OrderModel = model<IOrder>('Order', orderSchema);

const counterSchema = new Schema<{ _id: string; seq: number }>({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

export const CounterModel = model('Counter', counterSchema);

export default OrderModel;
