import { Request, Response } from 'express';
import { tableService } from './table.service.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validatedQuery } from '../../middleware/validate.middleware.js';
import type { TableAvailabilityQuery, TableMapQuery } from '../../schemas/table.schema.js';

export class TableController {
  getAll = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const tables = await tableService.getAll();
    res.json({ data: tables });
  });

  getMap = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { date, time } = validatedQuery<TableMapQuery>(req);
    const map = await tableService.getMap(date, time);
    res.json({ data: map });
  });

  getAvailable = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { date, time, partySize } = validatedQuery<TableAvailabilityQuery>(req);
    const tables = await tableService.getAvailable(date, time, partySize);
    res.json({ data: tables });
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const table = await tableService.getById(req.params.id);
    res.json({ data: table });
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const table = await tableService.create(req.body);
    res.status(201).json({ data: table });
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const table = await tableService.update(req.params.id, req.body);
    res.json({ data: table });
  });

  deactivate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const table = await tableService.deactivate(req.params.id);
    res.json({ data: table });
  });
}

export const tableController = new TableController();
