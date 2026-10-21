import { Document, Types } from 'mongoose';

export interface IProduct extends Document {
  productId: string;
  name: string;
  description: string;
  category: Types.ObjectId;
  seller: Types.ObjectId;
  price: number;
  discount: number;
  stock: number;
  isFeatured?: boolean;
  productImage: string;
  productImagePublicId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProductQueryParams {
  page?: string | number;
  limit?: string | number;
  category?: string | string[];
  categoryId?: string | string[];
  availability?: string;
  stockStatus?: string;
  inStock?: string | boolean;
  maxPrice?: string | number;
  max_price?: string | number;
  minPrice?: string | number;
  min_price?: string | number;
  maximumPrice?: string | number;
  minimumPrice?: string | number;
  max?: string | number;
  min?: string | number;
  search?: string;
  q?: string;
  keyword?: string;
  searchTerm?: string;
  featured?: string | boolean;
  isFeatured?: string | boolean;
  sort?: string;
  sortBy?: string;
  sortOrder?: string;
  order?: string;
  [key: string]: any;
}
