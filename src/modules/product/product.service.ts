import mongoose, { PipelineStage } from 'mongoose';
import ProductModel from './product.model';
import { IProduct, IProductQueryParams } from './product.interface';
import CategoryModel from '../category/categpry.model';
import cloudinary from '../../config/cloudinary';
import AppError from '../../utils/appError';
import { Pagination } from '../../utils/apiResponse';
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

const getProductsServices = async (
  queryParams: IProductQueryParams = {}
): Promise<{ products: IProduct[]; pagination: Pagination }> => {
  const matchStage: Record<string, any> = {};

  // 1. Filter by category (by ObjectId or category name)
  const categoryInput = queryParams.category || queryParams.categoryId;
  if (categoryInput) {
    const categoryValues = (
      Array.isArray(categoryInput)
        ? categoryInput
        : String(categoryInput).split(',')
    )
      .map((c) => c.trim())
      .filter(Boolean);

    if (categoryValues.length > 0) {
      const objectIds: mongoose.Types.ObjectId[] = [];
      const nameQueries: string[] = [];

      for (const val of categoryValues) {
        if (mongoose.isValidObjectId(val)) {
          objectIds.push(new mongoose.Types.ObjectId(val));
        } else {
          nameQueries.push(val);
        }
      }

      if (nameQueries.length > 0) {
        const escapedNames = nameQueries.map((name) =>
          name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        );
        const matchedCategories = await CategoryModel.find({
          name: { $in: escapedNames.map((n) => new RegExp(`^${n}$`, 'i')) },
        }).select('_id');

        for (const cat of matchedCategories) {
          objectIds.push(cat._id as mongoose.Types.ObjectId);
        }
      }

      if (objectIds.length === 1) {
        matchStage.category = objectIds[0];
      } else if (objectIds.length > 1) {
        matchStage.category = { $in: objectIds };
      } else {
        // Category was specified but not found -> match nothing
        matchStage.category = new mongoose.Types.ObjectId();
      }
    }
  }

  // 2. Filter by stock availability: 'all', 'inStock', 'outOfStock'
  const rawAvailability = String(
    queryParams.availability ||
      queryParams.stockStatus ||
      (queryParams.inStock !== undefined ? queryParams.inStock : '')
  )
    .toLowerCase()
    .trim();

  if (rawAvailability) {
    if (
      rawAvailability === 'instock' ||
      rawAvailability === 'in-stock' ||
      rawAvailability === 'in_stock' ||
      rawAvailability === 'in stock' ||
      rawAvailability === 'available' ||
      rawAvailability === 'true'
    ) {
      matchStage.stock = { $gt: 0 };
    } else if (
      rawAvailability === 'outofstock' ||
      rawAvailability === 'out-of-stock' ||
      rawAvailability === 'out_of_stock' ||
      rawAvailability === 'out of stock' ||
      rawAvailability === 'unavailable' ||
      rawAvailability === 'false'
    ) {
      matchStage.stock = { $lte: 0 };
    }
    // 'all' / 'all stock' applies no filter, returning all products
  }

  // 3. Filter by maximum price (and optional minimum price)
  const maxPriceInput =
    queryParams.maxPrice !== undefined
      ? queryParams.maxPrice
      : queryParams.max_price !== undefined
        ? queryParams.max_price
        : queryParams.maximumPrice !== undefined
          ? queryParams.maximumPrice
          : queryParams.max;

  if (maxPriceInput !== undefined && maxPriceInput !== null && maxPriceInput !== '') {
    const maxPriceNum = Number(maxPriceInput);
    if (!isNaN(maxPriceNum)) {
      matchStage.price = { ...(matchStage.price || {}), $lte: maxPriceNum };
    }
  }

  const minPriceInput =
    queryParams.minPrice !== undefined
      ? queryParams.minPrice
      : queryParams.min_price !== undefined
        ? queryParams.min_price
        : queryParams.minimumPrice !== undefined
          ? queryParams.minimumPrice
          : queryParams.min;

  if (minPriceInput !== undefined && minPriceInput !== null && minPriceInput !== '') {
    const minPriceNum = Number(minPriceInput);
    if (!isNaN(minPriceNum)) {
      matchStage.price = { ...(matchStage.price || {}), $gte: minPriceNum };
    }
  }

  // 4. Filter by featured status
  const featuredInput =
    queryParams.featured !== undefined
      ? queryParams.featured
      : queryParams.isFeatured;

  if (featuredInput !== undefined && featuredInput !== null && featuredInput !== '') {
    const featuredStr = String(featuredInput).toLowerCase().trim();
    if (featuredStr === 'true') {
      matchStage.isFeatured = true;
    } else if (featuredStr === 'false') {
      matchStage.isFeatured = { $ne: true };
    }
  }

  // 5. Search by name, description, productId
  const searchInput =
    queryParams.search ||
    queryParams.q ||
    queryParams.keyword ||
    queryParams.searchTerm;

  if (searchInput && String(searchInput).trim()) {
    const searchTrimmed = String(searchInput).trim();
    const escapedSearch = searchTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    matchStage.$or = [
      { name: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
      { productId: { $regex: searchRegex } },
    ];
  }

  // 6. Sorting: low to high, high to low, featured, newest (default)
  const sortInput = String(queryParams.sort || queryParams.sortBy || '')
    .toLowerCase()
    .trim();
  const sortOrderInput = String(queryParams.sortOrder || queryParams.order || '')
    .toLowerCase()
    .trim();

  const isFeaturedSort = sortInput === 'featured';
  let sortStage: Record<string, 1 | -1> = { createdAt: -1 };

  if (
    sortInput === 'low-to-high' ||
    sortInput === 'lowtohigh' ||
    sortInput === 'low_to_high' ||
    sortInput === 'price-asc' ||
    sortInput === 'price_asc' ||
    sortInput === 'asc' ||
    (sortInput === 'price' && sortOrderInput !== 'desc')
  ) {
    sortStage = { price: 1, createdAt: -1 };
  } else if (
    sortInput === 'high-to-low' ||
    sortInput === 'hightolow' ||
    sortInput === 'high_to_low' ||
    sortInput === 'price-desc' ||
    sortInput === 'price_desc' ||
    sortInput === 'desc' ||
    (sortInput === 'price' && sortOrderInput === 'desc')
  ) {
    sortStage = { price: -1, createdAt: -1 };
  } else if (sortInput === 'oldest') {
    sortStage = { createdAt: 1 };
  } else if (sortInput === 'newest' || sortInput === 'latest') {
    sortStage = { createdAt: -1 };
  }

  // 7. Pagination calculation (default 10 products per page)
  const pageNumber = Math.max(1, Number(queryParams.page) || 1);
  const limitNumber = Math.max(1, Number(queryParams.limit) || 10);
  const skip = (pageNumber - 1) * limitNumber;

  // 8. Aggregation Pipeline using $facet
  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        products: [
          ...(isFeaturedSort
            ? [
                {
                  $addFields: {
                    isFeaturedOrder: {
                      $cond: [{ $eq: ['$isFeatured', true] }, 1, 0],
                    },
                  },
                },
                {
                  $sort: {
                    isFeaturedOrder: -1,
                    createdAt: -1,
                  } as Record<string, 1 | -1>,
                },
                {
                  $project: { isFeaturedOrder: 0 },
                },
              ]
            : [{ $sort: sortStage }]),
          { $skip: skip },
          { $limit: limitNumber },
          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'category',
            },
          },
          {
            $unwind: {
              path: '$category',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'seller',
              foreignField: '_id',
              as: 'seller',
              pipeline: [
                {
                  $project: {
                    storeName: 1,
                    email: 1,
                    firstName: 1,
                    lastName: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: {
              path: '$seller',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    },
  ];

  const [aggregationResult] = await ProductModel.aggregate(pipeline);

  const totalDocuments = aggregationResult?.metadata?.[0]?.total || 0;
  const products = aggregationResult?.products || [];
  const totalPages = Math.ceil(totalDocuments / limitNumber);

  const pagination: Pagination = {
    page: pageNumber,
    limit: limitNumber,
    totalDocuments,
    totalPages,
    hasNextPage: pageNumber < totalPages,
    hasPrevPage: pageNumber > 1,
  };

  return {
    products,
    pagination,
  };
};

const getProductByIdService = async (productId: string) => {
  let product = await ProductModel.findOne({ productId })
    .populate('category', 'name')
    .populate('seller', 'storeName email firstName lastName');

  if (!product && mongoose.isValidObjectId(productId)) {
    product = await ProductModel.findById(productId)
      .populate('category', 'name')
      .populate('seller', 'storeName email firstName lastName');
  }

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  return product;
};

const updateProductsService = async (
  productId: string,
  sellerId: string,
  updateData: Partial<IProduct>,
  file?: Express.Multer.File
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

  const oldImagePublicId = product.productImagePublicId;

  Object.assign(product, updateData);

  if (file) {
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: 'productImages',
    });

    product.productImage = uploadResult.secure_url;
    product.productImagePublicId = uploadResult.public_id;
  }

  await product.save();

  if (file && oldImagePublicId) {
    try {
      await cloudinary.uploader.destroy(oldImagePublicId);
    } catch (error) {
      console.error('Failed to delete old product image:', error);
    }
  }

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
  getProductByIdService,
  deleteProductsService,
  updateProductsService,
};
