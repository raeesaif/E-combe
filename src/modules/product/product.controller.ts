import {
  createProductService,
  getProductsServices,
  deleteProductsService,
  updateProductsService,
} from './product.service';
import apiResponse from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import AppError from '../../utils/appError';
import { Request, Response } from 'express';

const createproductController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(
        401,
        'You are not logged in! Please log in to get access.'
      );
    }

    if (!req.file) {
      throw new AppError(400, 'Product image is required');
    }

    const product = await createProductService(
      req.body,
      String(req.user._id),
      req.file
    );
    apiResponse.success(res, product, 'Product created successfully!', 201);
  }
);

const getProductsController = catchAsync(
  async (_req: Request, res: Response): Promise<void> => {
    const products = await getProductsServices();
    apiResponse.success(res, products, 'Products retrieved successfully', 200);
  }
);

const updateProductController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(
        401,
        'You are not logged in! Please log in to get access.'
      );
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Product id is required');
    }

    const product = await updateProductsService(
      String(id),
      String(req.user._id),
      req.body
    );
    apiResponse.success(res, product, 'Product updated successfully', 200);
  }
);

const deleteProductController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(
        401,
        'You are not logged in! Please log in to get access.'
      );
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Product id is required');
    }

    await deleteProductsService(String(id), String(req.user._id));
    apiResponse.success(res, null, 'Product deleted successfully', 200);
  }
);

export {
  createproductController,
  getProductsController,
  updateProductController,
  deleteProductController,
};
