import { Request, Response } from 'express';
import {
  checkoutService,
  verifyPaymentService,
  getMyOrdersService,
  getMyOrderService,
  getSellerOrdersService,
  updateOrderStatusService,
} from './order.service';
import apiResponse from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import AppError from '../../utils/appError';

const requireUserId = (req: Request): string => {
  if (!req.user) {
    throw new AppError(
      401,
      'You are not logged in! Please log in to get access.'
    );
  }

  return String(req.user._id);
};

const checkoutController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const result = await checkoutService(requireUserId(req), req.body);
    apiResponse.success(res, result, 'Checkout session created', 201);
  }
);

const verifyPaymentController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const order = await verifyPaymentService(
      requireUserId(req),
      req.body.sessionId
    );
    apiResponse.success(res, order, 'Payment status updated', 200);
  }
);

const getMyOrdersController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const orders = await getMyOrdersService(requireUserId(req));
    apiResponse.success(res, orders, 'Orders retrieved successfully', 200);
  }
);

const getMyOrderController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const order = await getMyOrderService(
      requireUserId(req),
      String(req.params.orderId)
    );
    apiResponse.success(res, order, 'Order retrieved successfully', 200);
  }
);

const getSellerOrdersController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const orders = await getSellerOrdersService(requireUserId(req));
    apiResponse.success(res, orders, 'Orders retrieved successfully', 200);
  }
);

const updateOrderStatusController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const result = await updateOrderStatusService(
      requireUserId(req),
      String(req.params.orderId),
      req.body.status
    );
    apiResponse.success(res, result, 'Order status updated successfully', 200);
  }
);

export {
  checkoutController,
  verifyPaymentController,
  getMyOrdersController,
  getMyOrderController,
  getSellerOrdersController,
  updateOrderStatusController,
};
