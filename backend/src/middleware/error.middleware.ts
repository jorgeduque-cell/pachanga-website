import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = err.meta?.target as string[];
      res.status(409).json({
        error: `El valor ya existe: ${target?.join(', ')}`,
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Registro no encontrado',
      });
      return;
    }

    res.status(400).json({
      error: 'Error de base de datos',
      ...(env.NODE_ENV === 'development' && { details: err.message }),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: 'Datos inválidos',
      ...(env.NODE_ENV === 'development' && { details: err.message }),
    });
    return;
  }

  // Default error
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(env.NODE_ENV === 'development' && {
      message: err.message,
      stack: err.stack
    }),
  });
};

export const notFoundHandler = (
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    error: 'Recurso no encontrado',
  });
};
