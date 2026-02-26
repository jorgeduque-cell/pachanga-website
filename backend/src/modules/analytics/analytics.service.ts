import { prisma } from '../../lib/prisma.js';

interface ChartPoint { month: string; count: number; }
interface StatusPoint { status: string; count: number; }
interface RatingPoint { rating: number; count: number; }

export class AnalyticsService {

  async getNewCustomersByMonth(months = 6): Promise<ChartPoint[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const results = await prisma.$queryRaw<ChartPoint[]>`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month,
             COUNT(*)::int AS count
      FROM customers
      WHERE created_at >= ${since}
      GROUP BY month
      ORDER BY month ASC
    `;
    return results;
  }

  async getMessagesByStatus(): Promise<StatusPoint[]> {
    const results = await prisma.whatsAppMessage.groupBy({
      by: ['status'],
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } },
    });
    return results.map(r => ({ status: r.status, count: r._count.status }));
  }

  async getRatingDistribution(): Promise<RatingPoint[]> {
    const results = await prisma.customer.groupBy({
      by: ['rating'],
      _count: { rating: true },
      where: { rating: { not: null } },
      orderBy: { rating: 'asc' },
    });
    return results.map(r => ({
      rating: r.rating!,
      count: r._count.rating,
    }));
  }

  async getVisitsTrend(months = 6): Promise<ChartPoint[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    return prisma.$queryRaw<ChartPoint[]>`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month,
             SUM(total_visits)::int AS count
      FROM customers
      WHERE last_visit_at >= ${since}
      GROUP BY month
      ORDER BY month ASC
    `;
  }
}

export const analyticsService = new AnalyticsService();
