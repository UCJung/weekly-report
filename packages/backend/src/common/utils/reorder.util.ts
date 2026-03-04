/**
 * 정렬 순서 변경 공통 유틸리티
 * team.service.ts, member.service.ts, team-project.service.ts,
 * project.service.ts 에서 반복되는
 * orderedIds.map → prisma.$transaction 패턴을 추출한 헬퍼 함수
 */
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * orderedIds 배열 순서대로 sortOrder를 0, 1, 2, ... 로 업데이트하는
 * Prisma 트랜잭션 작업 배열을 생성하여 실행한다.
 *
 * @param prisma       PrismaService 인스턴스
 * @param orderedIds   새 순서 기준 ID 배열
 * @param updateFn     (id: string, index: number) => PrismaPromise — 각 항목을 업데이트하는 함수
 * @returns            트랜잭션 실행 결과 배열
 */
export async function applyReorder<T>(
  prisma: PrismaService,
  orderedIds: string[],
  updateFn: (id: string, index: number) => Prisma.PrismaPromise<T>,
): Promise<T[]> {
  return prisma.$transaction(
    orderedIds.map((id, index) => updateFn(id, index)),
  );
}
