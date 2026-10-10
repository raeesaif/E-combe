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

  // Handle Stripe SDK errors cleanly
  if (err && typeof err === 'object' && ('type' in err || err.name?.includes('Stripe'))) {
    const stripeErr = err as { statusCode?: number; message?: string; type?: string; code?: string };
    console.error('[STRIPE ERROR HANDLER]:', {
      type: stripeErr.type,
      code: stripeErr.code,
      message: stripeErr.message,
    });
    res.status(stripeErr.statusCode || 400).json({
      status: 'fail',
      message: stripeErr.message || 'Stripe payment error occurred',
      data: null,
    });
    return;
  }

  console.error('UNEXPECTED ERROR:', err);

  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    status: 'error',
    message: isDev && err?.message ? err.message : 'Something went wrong',
    data: null,
  });
};

export default errorHandler;
