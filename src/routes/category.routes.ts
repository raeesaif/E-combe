import { Router } from 'express';
import {
  createCategoryController,
  getAllCategoriesController,
  updateCategoryController,
  deleteCategoryController,
  getCategoryController,
} from '../modules/category/category.controller';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from '../modules/category/category.validation';
import validateSchemaPayload from '../utils/validateSchemaPayload';
import { authMiddleware, restrictTo } from '../modules/auth/user.middleware';

const router = Router();

router.get('/', getAllCategoriesController);
router.get('/active', getCategoryController);

router.post(
  '/',
  authMiddleware,
  restrictTo('admin'),
  validateSchemaPayload(CreateCategorySchema),
  createCategoryController
);

router.patch(
  '/:id',
  authMiddleware,
  restrictTo('admin'),
  validateSchemaPayload(UpdateCategorySchema),
  updateCategoryController
);

router.delete(
  '/:id',
  authMiddleware,
  restrictTo('admin'),
  deleteCategoryController
);

export default router;
