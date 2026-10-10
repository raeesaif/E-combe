import { z } from 'zod';

export const VerifyPaymentSchema = z.object({
  sessionId: z
    .string({ error: 'Session id is required' })
    .min(1, { message: 'Session id is required' }),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['processing', 'shipped', 'delivered'], {
    error: 'Status must be one of: processing, shipped, delivered',
  }),
});

export const CheckoutSchema = z
  .object({
    productId: z.string().optional(),
    quantity: z.number().int().positive().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product id is required'),
          quantity: z.number().int().positive().default(1),
        })
      )
      .optional(),
  })
  .optional();
