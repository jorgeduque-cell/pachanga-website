

// ─── Types ───────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Constants ───────────────────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

// ─── Helper ──────────────────────────────────────────────────
/**
 * Builds pagination metadata from query params.
 * Returns skip, take, page, limit for use with Prisma queries.
 */
export function buildPagination(params: PaginationParams) {
  const page = params.page ?? DEFAULT_PAGE;
  const limit = params.limit ?? DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
}

/**
 * Wraps query results with pagination metadata.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
