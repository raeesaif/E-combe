import { Router } from 'express';
import {
  checkoutController,
  verifyPaymentController,
  getMyOrdersController,
  getMyOrderController,
  getSellerOrdersController,
  updateOrderStatusController,
} from '../modules/order/order.controller';
import {
  VerifyPaymentSchema,
  UpdateOrderStatusSchema,
  CheckoutSchema,
} from '../modules/order/order.validation';
import validateSchemaPayload from '../utils/validateSchemaPayload';
import { authMiddleware, restrictTo } from '../modules/auth/user.middleware';

const router = Router();

router.post(
  '/checkout',
  authMiddleware,
  restrictTo('customer'),
  validateSchemaPayload(CheckoutSchema),
  checkoutController
);

router.post(
  '/verify',
  authMiddleware,
  restrictTo('customer'),
  validateSchemaPayload(VerifyPaymentSchema),
  verifyPaymentController
);

router.get('/my', authMiddleware, restrictTo('customer'), getMyOrdersController);

router.get(
  '/my/:orderId',
  authMiddleware,
  restrictTo('customer'),
  getMyOrderController
);

router.get(
  '/seller',
  authMiddleware,
  restrictTo('seller'),
  getSellerOrdersController
);

router.patch(
  '/seller/:orderId/status',
  authMiddleware,
  restrictTo('seller'),
  validateSchemaPayload(UpdateOrderStatusSchema),
  updateOrderStatusController
);

export default router;
