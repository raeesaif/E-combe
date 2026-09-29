import { z } from 'zod';

export const UpdateCartQuantitySchema = z.object({
  quantity: z
    .number({ error: 'Quantity is required' })
    .int({ message: 'Quantity must be an integer' })
    .min(1, { message: 'Quantity must be at least 1' }),
});
