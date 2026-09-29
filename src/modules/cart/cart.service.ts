import mongoose from 'mongoose';
import ProductModel from '../product/product.model';
import CartModel from './cart.model';
import AppError from '../../utils/appError';

const addToCartService = async (
  customerId: string,
  productId: string,
  quantity: number = 1
) => {
  let product = await ProductModel.findOne({ productId });

  if (!product && mongoose.isValidObjectId(productId)) {
    product = await ProductModel.findById(productId);
  }

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  const qty = Math.max(1, Number(quantity) || 1);

  if (product.stock < qty) {
    throw new AppError(400, 'Insufficient stock');
  }

  let cart = await CartModel.findOne({
    customer: customerId,
  });

  if (!cart) {
    cart = await CartModel.create({
      customer: customerId,
      items: [
        {
          product: product._id,
          quantity: qty,
        },
      ],
    });

    return cart;
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === product._id.toString()
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + qty;

    if (newQuantity > product.stock) {
      throw new AppError(400, `Only ${product.stock} items are available`);
    }

    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({
      product: product._id,
      quantity: qty,
    });
  }

  await cart.save();

  return cart;
};

const getCartService = async (customerId: string) => {
  const cart = await CartModel.findOne({ customer: customerId }).populate({
    path: 'items.product',
    populate: [
      { path: 'category', select: 'name' },
      { path: 'seller', select: 'storeName email firstName lastName' },
    ],
  });
  return cart;
};

const removeFromCartService = async (customerId: string, productId: string) => {
  let product = await ProductModel.findOne({ productId });
  if (!product && mongoose.isValidObjectId(productId)) {
    product = await ProductModel.findById(productId);
  }

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  const cart = await CartModel.findOne({ customer: customerId });
  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  const prodIdStr = product._id.toString();
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === prodIdStr
  );

  if (existingItemIndex === -1) {
    throw new AppError(404, 'Product not found in cart');
  }

  cart.items.splice(existingItemIndex, 1);
  await cart.save();
  return cart;
};

const updateCartQuantityService = async (
  customerId: string,
  productId: string,
  quantity: number
) => {
  let product = await ProductModel.findOne({ productId });
  if (!product && mongoose.isValidObjectId(productId)) {
    product = await ProductModel.findById(productId);
  }

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  const cart = await CartModel.findOne({ customer: customerId });
  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  const prodIdStr = product._id.toString();
  const existingItem = cart.items.find(
    (item) => item.product.toString() === prodIdStr
  );

  if (!existingItem) {
    throw new AppError(404, 'Product not found in cart');
  }

  const qty = Number(quantity);
  if (qty > product.stock) {
    throw new AppError(400, `Only ${product.stock} items are available`);
  }

  existingItem.quantity = qty;
  await cart.save();
  return cart;
};

export {
  addToCartService,
  getCartService,
  removeFromCartService,
  updateCartQuantityService,
};
