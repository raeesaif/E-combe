import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string({ error: 'Product name is required' }).min(1, { message: 'Product name is required' }),
  description: z
    .string({ error: 'Product description is required' })
    .min(1, { message: 'Product description is required' }),
  category: z.string({ error: 'Category is required' }).min(1, { message: 'Category is required' }),
  price: z.coerce.number({ error: 'Price is required' }).min(0, { message: 'Price cannot be negative' }),
  discount: z.coerce.number().min(0, { message: 'Discount cannot be negative' }).optional(),
  stock: z.coerce.number({ error: 'Stock is required' }).min(0, { message: 'Stock cannot be negative' }),
});

export const UpdateProductSchema = CreateProductSchema.partial();
