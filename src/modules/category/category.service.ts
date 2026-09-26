import CategoryModel from './categpry.model';
import { ICategory, ICategoryDoc } from './category.interface';
import AppError from '../../utils/appError';

const createCategoryService = async (categoryData: Partial<ICategory>) => {
  const existingCategory = await CategoryModel.findOne({
    name: categoryData.name,
  });
  if (existingCategory) {
    throw new AppError(400, 'Category name already exists');
  }

  const category = await CategoryModel.create(categoryData);

  return category;
};

const getAllCategoriesService = async () => {
  const categories = await CategoryModel.aggregate([
    {
      $lookup: {
        from: 'products',
        let: { categoryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$category', '$$categoryId'],
              },
            },
          },
          {
            $count: 'count',
          },
        ],
        as: 'productCount',
      },
    },
    {
      $project: {
        name: 1,
        active: 1,
        productCount: {
          $ifNull: [{ $arrayElemAt: ['$productCount.count', 0] }, 0],
        },
      },
    },
  ]);

  return categories;
};

const getCategoriesService = async () => {
  const categories = await CategoryModel.find(
    { active: true },
    { _id: 1, name: 1 }
  ).sort({ name: 1 });

  return categories;
};

const updateCategoryService = async (
  categoryId: string,
  name: string,
  active: boolean
): Promise<ICategoryDoc> => {
  const category = await CategoryModel.findById(categoryId);

  if (!category) {
    throw new AppError(404, 'Category not found');
  }

  const existingCategory = await CategoryModel.findOne({
    name,
    _id: { $ne: categoryId },
  });
  if (existingCategory) {
    throw new AppError(400, 'Category name already exists');
  }

  category.name = name;
  category.active = active;

  await category.save();

  return category;
};

const categoryDeleteService = async (categoryId: string): Promise<void> => {
  const category = await CategoryModel.findByIdAndDelete(categoryId);

  if (!category) {
    throw new AppError(404, 'Category not found');
  }
};

export {
  createCategoryService,
  getAllCategoriesService,
  updateCategoryService,
  categoryDeleteService,
  getCategoriesService,
};
