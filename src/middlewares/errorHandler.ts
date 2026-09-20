import type { ErrorRequestHandler } from 'express';
import AppError from '../utils/appError';

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      data: null,
    });
    return;
  }

  console.error('UNEXPECTED ERROR:', err);

  res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
    data: null,
  });
};

export default errorHandler;
