import type { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyPattern?: Record<string, any>;
  errors?: Record<string, any>;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern || {})[0];
    message = `Duplicate value for field: ${field}`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors || {}).map((e: any) => e.message);
    message = errors.join(', ');
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
};

export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error: CustomError = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
