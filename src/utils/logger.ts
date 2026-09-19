import type { NextFunction, Request, Response } from 'express';

const COLORS = {
  GET: '\x1b[32m', // green
  POST: '\x1b[33m', // yellow
  PUT: '\x1b[34m', // blue
  PATCH: '\x1b[36m', // cyan
  DELETE: '\x1b[31m', // red
} as const;

const RESET = '\x1b[0m';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const color = COLORS[req.method as keyof typeof COLORS] ?? RESET;
    console.log(
      `${color}${req.method}${RESET} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
    );
  });

  next();
};
