import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler to automatically catch errors and forward them to next().
 * Eliminates repetitive try/catch blocks in every controller method.
 *
 * Usage: router.get('/path', asyncHandler(controller.method));
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch(next);
    };
};
