import type { ZodSchema } from 'zod';

import AppError from '../utils/appError';
import catchAsync from './catchAsync';

const validateSchemaPayload = (schema: ZodSchema) =>
  catchAsync(async (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(', ');

      return next(new AppError(400, message));
    }

    req.body = result.data;

    next();
  });

export default validateSchemaPayload;
