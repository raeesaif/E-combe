import OrderModel, { CounterModel } from './order.model';
import {
  IOrder,
  IOrderItem,
  OrderItemStatus,
  ICheckoutPayload,
} from './order.interface';
import CartModel from '../cart/cart.model';
import ProductModel from '../product/product.model';
import { IProduct } from '../product/product.interface';
import getStripe from '../../config/stripe';
import { env } from '../../config/env';
import AppError from '../../utils/appError';
import mongoose from 'mongoose';

const ORDER_ID_START = 1000;

const generateOrderId = async (): Promise<string> => {
  const counter = await CounterModel.findOneAndUpdate(
    { _id: 'order' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  return `ORD-${ORDER_ID_START + counter.seq}`;
};

const toMoney = (value: number): number => Math.round(value * 100) / 100;

const deriveOrderStatus = (order: IOrder): OrderItemStatus => {
  if (order.paymentStatus === 'failed') return 'cancelled';
  if (order.paymentStatus !== 'paid') return 'pending';

  const statuses = new Set(order.items.map((item) => item.status));
  if (statuses.size === 1) return [...statuses][0];

  return 'processing';
};

const toCustomerOrder = (order: IOrder) => ({
  _id: order._id,
  orderId: order.orderId,
  date: order.createdAt,
  products: order.items.map((item) => ({
    product: item.product,
    name: item.name,
    image: item.image,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  })),
  total: order.totalAmount,
  payment: order.paymentStatus,
  status: deriveOrderStatus(order),
});

const checkoutService = async (
  customerId: string,
  payload?: ICheckoutPayload
) => {
  let items: Array<{
    product: mongoose.Types.ObjectId;
    seller: mongoose.Types.ObjectId;
    name: string;
    image?: string;
    unitPrice: number;
    quantity: number;
  }> = [];

  let fromCart = false;
  let cancelUrl = `${env.clientUrl}/cart`;

  const hasDirectItems = Boolean(
    payload?.productId || (payload?.items && payload.items.length > 0)
  );

  if (hasDirectItems) {
    const rawItems: Array<{ productId: string; quantity: number }> = [];
    if (payload?.productId) {
      rawItems.push({
        productId: payload.productId,
        quantity: Math.max(1, payload.quantity || 1),
      });
    } else if (payload?.items) {
      payload.items.forEach((it) => {
        rawItems.push({
          productId: it.productId,
          quantity: Math.max(1, it.quantity || 1),
        });
      });
    }

    for (const rawItem of rawItems) {
      const product = await ProductModel.findById(rawItem.productId);
      if (!product) {
        throw new AppError(404, `Product not found: ${rawItem.productId}`);
      }

      if (product.stock < rawItem.quantity) {
        throw new AppError(
          400,
          `Insufficient stock for "${product.name}". Only ${product.stock} available`
        );
      }

      items.push({
        product: product._id as unknown as mongoose.Types.ObjectId,
        seller: product.seller as unknown as mongoose.Types.ObjectId,
        name: product.name,
        image: product.productImage,
        unitPrice: toMoney(product.price * (1 - (product.discount || 0) / 100)),
        quantity: rawItem.quantity,
      });
    }

    if (rawItems.length === 1 && payload?.productId) {
      cancelUrl = `${env.clientUrl}/products/${payload.productId}`;
    }
  } else {
    fromCart = true;
    const cart = await CartModel.findOne({ customer: customerId }).populate(
      'items.product'
    );

    if (!cart || cart.items.length === 0) {
      throw new AppError(400, 'Your cart is empty');
    }

    items = cart.items.map((cartItem) => {
      const product = cartItem.product as unknown as IProduct | null;

      if (!product) {
        throw new AppError(400, 'A product in your cart no longer exists');
      }

      if (product.stock < cartItem.quantity) {
        throw new AppError(
          400,
          `Insufficient stock for "${product.name}". Only ${product.stock} available`
        );
      }

      return {
        product: product._id as unknown as mongoose.Types.ObjectId,
        seller: product.seller as unknown as mongoose.Types.ObjectId,
        name: product.name,
        image: product.productImage,
        unitPrice: toMoney(product.price * (1 - (product.discount || 0) / 100)),
        quantity: cartItem.quantity,
      };
    });
  }

  const totalAmount = toMoney(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );

  const order = await OrderModel.create({
    orderId: await generateOrderId(),
    customer: customerId,
    items,
    totalAmount,
    fromCart,
  });

  try {
    const session = await getStripe().checkout.sessions.create({
      allowed_payment_method_types: ['card'],
      mode: 'payment',
      client_reference_id: order.orderId,
      metadata: {
        orderId: order.orderId,
        customerId,
        fromCart: String(fromCart),
      },
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(item.unitPrice * 100),
          product_data: {
            name: item.name,
            ...(item.image && { images: [item.image] }),
          },
        },
      })),
      success_url: `${env.clientUrl}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    order.stripeSessionId = session.id;
    await order.save();

    return {
      orderId: order.orderId,
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  } catch (error: any) {
    await order.deleteOne();
    console.error('[Stripe Checkout Error]:', {
      message: error?.message,
      type: error?.type,
      code: error?.code,
      statusCode: error?.statusCode,
      rawMessage: error?.raw?.message,
    });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error?.statusCode || 400,
      error?.message
        ? `Stripe checkout error: ${error.message}`
        : 'Stripe checkout failed'
    );
  }
};

const verifyPaymentService = async (customerId: string, sessionId: string) => {
  const order = await OrderModel.findOne({
    stripeSessionId: sessionId,
    customer: customerId,
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  if (order.paymentStatus !== 'pending') {
    return toCustomerOrder(order);
  }

  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch (error: any) {
    console.error('[Stripe Retrieve Session Error]:', {
      message: error?.message,
      type: error?.type,
      code: error?.code,
      sessionId,
    });
    throw new AppError(
      error?.statusCode || 400,
      error?.message
        ? `Failed to verify payment with Stripe: ${error.message}`
        : 'Payment verification failed'
    );
  }

  if (session.payment_status === 'paid') {
    // Only the request that flips pending -> paid deducts stock / clears the cart
    const paidOrder = await OrderModel.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'pending' },
      { $set: { paymentStatus: 'paid', 'items.$[].status': 'processing' } },
      { new: true }
    );

    if (paidOrder) {
      for (const item of paidOrder.items) {
        const result = await ProductModel.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );

        if (result.modifiedCount === 0) {
          console.error(
            `Stock could not be deducted for ${item.name} on ${paidOrder.orderId}`
          );
        }
      }

      if (paidOrder.fromCart) {
        await CartModel.updateOne(
          { customer: customerId },
          { $set: { items: [] } }
        );
      }
    }

    const latest = paidOrder ?? (await OrderModel.findById(order._id));
    return toCustomerOrder(latest as IOrder);
  }

  if (session.status === 'expired') {
    order.paymentStatus = 'failed';
    await order.save();
  }

  return toCustomerOrder(order);
};

const getMyOrdersService = async (customerId: string) => {
  const orders = await OrderModel.find({ customer: customerId }).sort({
    createdAt: -1,
  });

  return orders.map(toCustomerOrder);
};

const getMyOrderService = async (customerId: string, orderId: string) => {
  const order = await OrderModel.findOne({ orderId, customer: customerId });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  return toCustomerOrder(order);
};

const getSellerOrdersService = async (sellerId: string) => {
  const orders = await OrderModel.find({
    'items.seller': sellerId,
    paymentStatus: 'paid',
  })
    .populate('customer', 'firstName lastName email')
    .sort({ createdAt: -1 });

  const rows: Record<string, unknown>[] = [];

  for (const order of orders) {
    const customer = order.customer as unknown as {
      _id: unknown;
      firstName: string;
      lastName: string;
      email: string;
    };

    order.items
      .filter((item: IOrderItem) => item.seller.toString() === sellerId)
      .forEach((item: IOrderItem) => {
        rows.push({
          orderId: order.orderId,
          itemId: item._id,
          customer: {
            _id: customer._id,
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
          },
          product: item.name,
          quantity: item.quantity,
          amount: toMoney(item.unitPrice * item.quantity),
          payment: order.paymentStatus,
          status: item.status,
          date: order.createdAt,
        });
      });
  }

  return rows;
};

const updateOrderStatusService = async (
  sellerId: string,
  orderId: string,
  status: OrderItemStatus
) => {
  const order = await OrderModel.findOne({
    orderId,
    'items.seller': sellerId,
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  if (order.paymentStatus !== 'paid') {
    throw new AppError(400, 'This order has not been paid yet');
  }

  order.items.forEach((item) => {
    if (item.seller.toString() === sellerId) {
      item.status = status;
    }
  });

  await order.save();

  return { orderId: order.orderId, status };
};

export {
  checkoutService,
  verifyPaymentService,
  getMyOrdersService,
  getMyOrderService,
  getSellerOrdersService,
  updateOrderStatusService,
};
