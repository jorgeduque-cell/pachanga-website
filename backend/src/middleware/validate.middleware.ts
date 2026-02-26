import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type RequestSource = 'body' | 'query' | 'params';

const createValidator = (source: RequestSource, errorMessage: string) => {
  return (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validated = schema.parse(req[source]);
        (req as unknown as Record<string, unknown>)[source] = validated;
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const messages = error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }));
          res.status(400).json({
            error: errorMessage,
            details: messages,
          });
          return;
        }
        next(error);
      }
    };
  };
};

export const validateBody = createValidator('body', 'Datos de entrada inválidos');
export const validateQuery = createValidator('query', 'Parámetros de consulta inválidos');
export const validateParams = createValidator('params', 'Parámetros de ruta inválidos');

/**
 * Type-safe helper to extract validated data from request.
 * Use after validateBody/validateQuery/validateParams middleware.
 *
 * Example:
 *   const filters = validatedQuery<CustomerFilters>(req);
 */
export function validatedBody<T>(req: Request): T {
  return req.body as T;
}

export function validatedQuery<T>(req: Request): T {
  return req.query as unknown as T;
}

export function validatedParams<T>(req: Request): T {
  return req.params as unknown as T;
}
