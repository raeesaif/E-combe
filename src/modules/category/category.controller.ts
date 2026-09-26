import {
  createCategoryService,
  getAllCategoriesService,
  updateCategoryService,
  categoryDeleteService,
  getCategoriesService,
} from './category.service';
import { Request, Response } from 'express';
import AppError from '../../utils/appError';
import catchAsync from '../../utils/catchAsync';
import apiResponse from '../../utils/apiResponse';

const createCategoryController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const category = await createCategoryService(req.body);
    apiResponse.success(res, category, 'Category created successfully', 201);
  }
);

const getAllCategoriesController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const categories = await getAllCategoriesService();
    apiResponse.success(
      res,
      categories,
      'Categories retrieved successfully',
      200
    );
  }
);

const getCategoryController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const categoryname = await getCategoriesService();
    apiResponse.success(
      res,
      categoryname,
      'Categories retrieved successfully',
      200
    );
  }
);

const updateCategoryController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, active } = req.body;

    if (!id) {
      throw new AppError(400, 'Category id is required');
    }

    const category = await updateCategoryService(String(id), name, active);
    apiResponse.success(res, category, 'Category updated successfully', 200);
  }
);

const deleteCategoryController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Category id is required');
    }

    await categoryDeleteService(String(id));
    apiResponse.success(res, null, 'Category deleted successfully', 200);
  }
);

export {
  createCategoryController,
  getAllCategoriesController,
  updateCategoryController,
  deleteCategoryController,
  getCategoryController,
};
