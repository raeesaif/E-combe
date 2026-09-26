import { Router } from 'express';
import {
  createproductController,
  getProductsController,
  updateProductController,
  deleteProductController,
} from '../modules/product/product.controller';
import {
  CreateProductSchema,
  UpdateProductSchema,
} from '../modules/product/product.validation';
import validateSchemaPayload from '../utils/validateSchemaPayload';
import { authMiddleware, restrictTo } from '../modules/auth/user.middleware';
import { uploadSingle } from '../utils/multer';

const router = Router();

router.get('/', getProductsController);

router.post(
  '/',
  authMiddleware,
  restrictTo('seller'),
  uploadSingle('productImage'),
  validateSchemaPayload(CreateProductSchema),
  createproductController
);

router.patch(
  '/:id',
  authMiddleware,
  restrictTo('seller'),
  validateSchemaPayload(UpdateProductSchema),
  updateProductController
);

router.delete('/:id', authMiddleware, restrictTo('seller'), deleteProductController);

export default router;
