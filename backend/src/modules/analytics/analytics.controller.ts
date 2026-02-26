import { Request, Response } from 'express';
import { analyticsService } from './analytics.service.js';
import { asyncHandler } from '../../middleware/async-handler.js';

const DEFAULT_MONTHS = 6;
const MAX_MONTHS = 12;

function parseMonthsParam(req: Request): number {
  const parsed = parseInt((req.query.months as string) ?? String(DEFAULT_MONTHS), 10);
  return Math.min(Number.isNaN(parsed) ? DEFAULT_MONTHS : parsed, MAX_MONTHS);
}

export class AnalyticsController {
  getNewCustomers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const chartData = await analyticsService.getNewCustomersByMonth(parseMonthsParam(req));
    res.json({ data: chartData });
  });

  getMessagesByStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const chartData = await analyticsService.getMessagesByStatus();
    res.json({ data: chartData });
  });

  getRatingDistribution = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const chartData = await analyticsService.getRatingDistribution();
    res.json({ data: chartData });
  });

  getVisitsTrend = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const chartData = await analyticsService.getVisitsTrend(parseMonthsParam(req));
    res.json({ data: chartData });
  });
}

export const analyticsController = new AnalyticsController();
