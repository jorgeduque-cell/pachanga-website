import { Request, Response } from 'express';
import { reservationService } from './reservation.service.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validatedQuery } from '../../middleware/validate.middleware.js';
import type { ReservationFilters } from '../../schemas/reservation.schema.js';

export class ReservationController {
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reservation = await reservationService.create(req.body);
    res.status(201).json({ data: reservation });
  });

  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = validatedQuery<ReservationFilters>(req);
    const result = await reservationService.getAll(filters);
    res.json(result);
  });

  getStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await reservationService.getStats();
    res.json({ data: stats });
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reservation = await reservationService.getById(req.params.id);
    res.json({ data: reservation });
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reservation = await reservationService.update(req.params.id, req.body);
    res.json({ data: reservation });
  });

  cancel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reservation = await reservationService.cancel(req.params.id);
    res.json({ data: reservation });
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await reservationService.remove(req.params.id);
    res.json(result);
  });
}

export const reservationController = new ReservationController();
