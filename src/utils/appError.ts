class AppError extends Error {
  statusCode: number;
  status: 'fail' | 'error';
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? 'error' : 'fail';
    this.isOperational = true;

    Error.captureStackTrace(this, AppError);
  }
}

export default AppError;
