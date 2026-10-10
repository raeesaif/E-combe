import { Document, Types } from 'mongoose';

export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type OrderItemStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface IOrderItem {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  seller: Types.ObjectId;
  name: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  status: OrderItemStatus;
}

export interface IOrder extends Document {
  orderId: string;
  customer: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  stripeSessionId?: string;
  fromCart?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICheckoutPayload {
  productId?: string;
  quantity?: number;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
}
