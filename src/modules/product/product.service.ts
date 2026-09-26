import ProductModel from './product.model';
import { IProduct } from './product.interface';
import cloudinary from '../../config/cloudinary';
import AppError from '../../utils/appError';
const generateProductId = async (): Promise<string> => {
  const lastProduct = await ProductModel.findOne().sort({ createdAt: -1 });

  if (!lastProduct) {
    return 'PRD-1001';
  }

  const lastNumber = Number(lastProduct.productId.split('-')[1]);
  return `PRD-${lastNumber + 1}`;
};

const createProductService = async (
  productData: IProduct,
  sellerId: string,
  file?: Express.Multer.File
) => {
  let productImage: string | undefined;
  let productImagePublicId: string | undefined;

  if (file) {
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: 'productImages',
    });

    productImage = uploadResult.secure_url;
    productImagePublicId = uploadResult.public_id;
  }

  const productId = await generateProductId();

  const product = await ProductModel.create({
    ...productData,
    productId,
    seller: sellerId,
    productImage,
    productImagePublicId,
  });

  return product;
};

const getProductsServices = async () => {
  const products = await ProductModel.find().populate(
    'seller',
    'storeName email firstName lastName'
  );

  return products;
};

const updateProductsService = async (
  productId: string,
  sellerId: string,
  updateData: Partial<IProduct>
): Promise<IProduct> => {
  const product = await ProductModel.findById(productId);

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  if (product.seller.toString() !== sellerId) {
    throw new AppError(
      403,
      'You do not have permission to update this product'
    );
  }

  Object.assign(product, updateData);
  await product.save();

  return product;
};

const deleteProductsService = async (
  productId: string,
  sellerId: string
): Promise<void> => {
  const product = await ProductModel.findById(productId);

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  if (product.seller.toString() !== sellerId) {
    throw new AppError(
      403,
      'You do not have permission to delete this product'
    );
  }

  await product.deleteOne();
};

export {
  createProductService,
  getProductsServices,
  deleteProductsService,
  updateProductsService,
};
