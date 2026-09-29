import { Request, Response } from 'express';
import {
  addToCartService,
  getCartService,
  removeFromCartService,
  updateCartQuantityService,
} from './cart.service';
import apiResponse from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import AppError from '../../utils/appError';

const addtoCartController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(401, 'You are not logged in! Please log in to get access.');
    }

    const { productId, quantity } = req.body;
    const cart = await addToCartService(
      String(req.user._id),
      productId,
      quantity
    );
    apiResponse.success(res, cart, 'Product added to cart successfully', 201);
  }
);

const getCartController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(401, 'You are not logged in! Please log in to get access.');
    }

    const cart = await getCartService(String(req.user._id));
    apiResponse.success(res, cart, 'Cart retrieved successfully', 200);
  }
);

const removeFromCartController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(401, 'You are not logged in! Please log in to get access.');
    }

    const { productId } = req.params;
    const cart = await removeFromCartService(String(req.user._id), String(productId));
    apiResponse.success(res, cart, 'Product removed from cart successfully', 200);
  }
);

const updateCartItemController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(401, 'You are not logged in! Please log in to get access.');
    }

    const { productId } = req.params;
    const { quantity } = req.body;
    const cart = await updateCartQuantityService(
      String(req.user._id),
      String(productId),
      Number(quantity)
    );
    apiResponse.success(res, cart, 'Cart updated successfully', 200);
  }
);

export {
  addtoCartController,
  getCartController,
  removeFromCartController,
  updateCartItemController,
};
