import type { Response } from 'express';

interface Pagination {
  page: number;
  limit: number;
  totalDocuments: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const apiResponse = {
  success: (
    res: Response,
    data: unknown,
    message = 'Success',
    statusCode = 200,
    pagination?: Pagination
  ): void => {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(pagination && { pagination }),
    });
  },

  error: (
    res: Response,
    message = 'Error',
    statusCode = 400,
    errors: unknown = null
  ): void => {
    res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  },
};

export default apiResponse;
export type { Pagination };
