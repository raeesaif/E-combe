import { z } from 'zod';

export const RegisterSchema = z
  .object({
    firstName: z
      .string({ error: 'First name is required' })
      .min(1, { message: 'First name is required' }),
    lastName: z
      .string({ error: 'Last name is required' })
      .min(1, { message: 'Last name is required' }),
    email: z
      .string({ error: 'Email is required' })
      .min(1, { message: 'Email is required' })
      .email({ message: 'Invalid email address' }),
    password: z
      .string({ error: 'Password is required' })
      .min(6, { message: 'Password must be at least 6 characters long' }),
    role: z.enum(['customer', 'seller']).default('customer'),
    storeName: z.string().min(1, { message: 'Store name is required' }).optional(),
    description: z.string().min(1, { message: 'Description is required' }).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== 'seller') return;

    if (!data.storeName) {
      ctx.addIssue({
        code: 'custom',
        message: 'Store name is required',
        path: ['storeName'],
      });
    }

    if (!data.description) {
      ctx.addIssue({
        code: 'custom',
        message: 'Description is required',
        path: ['description'],
      });
    }
  });

export const LoginSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
  password: z
    .string({ error: 'Password is required' })
    .min(1, { message: 'Password is required' }),
});
