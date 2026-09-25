import z from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(1, { message: 'Category name is required' }),
  description: z
    .string()
    .max(500, { message: 'Description must be at most 500 characters' }),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1, { message: 'Category name is required' }),
  active: z.boolean({ error: 'Active must be a boolean' }),
});
