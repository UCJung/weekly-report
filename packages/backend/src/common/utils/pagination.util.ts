/**
 * 페이지네이션 공통 유틸리티
 * admin.service.ts, team-join.service.ts, project.service.ts 에서 반복되는
 * page/limit/skip 계산 및 응답 조립 패턴을 추출한 헬퍼 함수 모음
 */

export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * page/limit → { skip, take, page, limit } 반환
 * - page 기본값: 1 (0 이하면 1로 보정)
 * - limit 기본값: 20 (0 이하면 20으로 보정)
 */
export function parsePagination(
  page?: number | null,
  limit?: number | null,
): PaginationParams {
  const safePage = page && page > 0 ? page : 1;
  const safeLimit = limit && limit > 0 ? limit : 20;
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
  };
}

/**
 * 데이터 배열 + total + page/limit → 페이지네이션 응답 객체 반환
 */
export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
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
