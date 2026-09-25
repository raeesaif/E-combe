import { model, Schema } from 'mongoose';
import { ICategoryDoc } from './category.interface';

const categorySchema = new Schema<ICategoryDoc>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trime: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },

    active: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

const CategoryModel = model<ICategoryDoc>('Category', categorySchema);

export default CategoryModel;
