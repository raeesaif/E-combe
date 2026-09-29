import { Router } from 'express';
import {
  addtoCartController,
  getCartController,
  removeFromCartController,
  updateCartItemController,
} from '../modules/cart/cart.controller';
import { authMiddleware } from '../modules/auth/user.middleware';
import validateSchemaPayload from '../utils/validateSchemaPayload';
import { UpdateCartQuantitySchema } from '../modules/cart/cart.validation';

const router = Router();

router.get('/', authMiddleware, getCartController);
router.post('/', authMiddleware, addtoCartController);
router.patch(
  '/:productId',
  authMiddleware,
  validateSchemaPayload(UpdateCartQuantitySchema),
  updateCartItemController
);
router.delete('/:productId', authMiddleware, removeFromCartController);

export default router;
