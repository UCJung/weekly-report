import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { HttpStatus } from '@nestjs/common';
import { TaskStatusCategory } from '@prisma/client';
import { TaskStatusService } from './task-status.service';
import { BusinessException } from '../common/filters/business-exception';

// ── Prisma mock ────────────────────────────────────────────────────────────

const mockTx = {
  taskStatusDef: {
    findFirst: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    updateMany: mock(() => Promise.resolve({ count: 0 })),
  },
  personalTask: {
    count: mock(() => Promise.resolve(0)),
    findFirst: mock(() => Promise.resolve(null)),
    updateMany: mock(() => Promise.resolve({ count: 0 })),
  },
};

const mockPrisma = {
  team: {
    findUnique: mock(() => Promise.resolve(null)),
  },
  taskStatusDef: {
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    updateMany: mock(() => Promise.resolve({ count: 0 })),
    aggregate: mock(() => Promise.resolve({ _max: { sortOrder: null } })),
    count: mock(() => Promise.resolve(0)),
  },
  personalTask: {
    count: mock(() => Promise.resolve(0)),
    updateMany: mock(() => Promise.resolve({ count: 0 })),
  },
  $transaction: mock((fn: unknown) => {
    if (typeof fn === 'function') {
      return fn(mockTx);
    }
    return Promise.all(fn as Promise<unknown>[]);
  }),
};

// ── Helper ─────────────────────────────────────────────────────────────────

function resetMocks() {
  mockPrisma.team.findUnique.mockReset();
  mockPrisma.taskStatusDef.findMany.mockReset();
  mockPrisma.taskStatusDef.findFirst.mockReset();
  mockPrisma.taskStatusDef.create.mockReset();
  mockPrisma.taskStatusDef.update.mockReset();
  mockPrisma.taskStatusDef.updateMany.mockReset();
  mockPrisma.taskStatusDef.aggregate.mockReset();
  mockPrisma.taskStatusDef.count.mockReset();
  mockPrisma.personalTask.count.mockReset();
  mockPrisma.personalTask.updateMany.mockReset();
  mockPrisma.$transaction.mockReset();

  mockTx.taskStatusDef.findFirst.mockReset();
  mockTx.taskStatusDef.create.mockReset();
  mockTx.taskStatusDef.update.mockReset();
  mockTx.taskStatusDef.updateMany.mockReset();
  mockTx.personalTask.count.mockReset();
  mockTx.personalTask.findFirst.mockReset();
  mockTx.personalTask.updateMany.mockReset();

  // 기본 $transaction 구현 복원
  mockPrisma.$transaction.mockImplementation((fn: unknown) => {
    if (typeof fn === 'function') {
      return fn(mockTx);
    }
    return Promise.all(fn as Promise<unknown>[]);
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('TaskStatusService', () => {
  let service: TaskStatusService;

  beforeEach(() => {
    service = new TaskStatusService(mockPrisma as never);
    resetMocks();
  });

  // ── getByTeam ─────────────────────────────────────────────────────────────

  describe('getByTeam', () => {
    it('should query with isDeleted=false filter', async () => {
      const statuses = [
        { id: 's1', teamId: 'team-1', name: '할일', isDeleted: false, sortOrder: 0 },
        { id: 's2', teamId: 'team-1', name: '진행중', isDeleted: false, sortOrder: 1 },
      ];
      mockPrisma.taskStatusDef.findMany.mockResolvedValueOnce(statuses as never);

      const result = await service.getByTeam('team-1');

      expect(mockPrisma.taskStatusDef.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ teamId: 'team-1', isDeleted: false }),
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no statuses exist', async () => {
      mockPrisma.taskStatusDef.findMany.mockResolvedValueOnce([]);

      const result = await service.getByTeam('team-empty');
      expect(result).toHaveLength(0);
    });

    it('should NOT return deleted statuses', async () => {
      // findMany가 isDeleted=false 조건으로 호출되어야 하며, 삭제된 항목은 반환되지 않아야 함
      mockPrisma.taskStatusDef.findMany.mockResolvedValueOnce([
        { id: 's1', teamId: 'team-1', name: '할일', isDeleted: false, sortOrder: 0 },
      ] as never);

      const result = await service.getByTeam('team-1');

      const callArgs = mockPrisma.taskStatusDef.findMany.mock.calls[0][0] as { where: { isDeleted: boolean } };
      expect(callArgs.where.isDeleted).toBe(false);
      expect(result).toHaveLength(1);
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should throw TASK_STATUS_NOT_FOUND when status does not exist', async () => {
      mockPrisma.taskStatusDef.findFirst.mockResolvedValueOnce(null);

      try {
        await service.delete('team-1', 'nonexistent-id');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('TASK_STATUS_NOT_FOUND');
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should throw TASK_STATUS_MIN_ONE when deleting the last status in a category', async () => {
      const status = {
        id: 's1',
        teamId: 'team-1',
        name: '할일',
        category: TaskStatusCategory.BEFORE_START,
        isDeleted: false,
      };
      mockPrisma.taskStatusDef.findFirst.mockResolvedValueOnce(status as never);
      // count가 1이면 마지막 상태 — 삭제 불가
      mockPrisma.taskStatusDef.count.mockResolvedValueOnce(1);

      try {
        await service.delete('team-1', 's1');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('TASK_STATUS_MIN_ONE');
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should migrate PersonalTasks to fallback status before soft-deleting', async () => {
      const status = {
        id: 's1',
        teamId: 'team-1',
        name: '할일',
        category: TaskStatusCategory.BEFORE_START,
        isDeleted: false,
      };
      const fallbackStatus = { id: 's2', teamId: 'team-1', name: '검토중', sortOrder: 1 };

      mockPrisma.taskStatusDef.findFirst.mockResolvedValueOnce(status as never);
      // 카테고리 내 상태가 2개 이상 → 삭제 허용
      mockPrisma.taskStatusDef.count.mockResolvedValueOnce(2);

      // 트랜잭션 내부 mock 설정
      mockTx.personalTask.count.mockResolvedValueOnce(3); // 이전 대상 Task 존재
      mockTx.taskStatusDef.findFirst.mockResolvedValueOnce(fallbackStatus as never);
      mockTx.personalTask.updateMany.mockResolvedValueOnce({ count: 3 });
      mockTx.taskStatusDef.update.mockResolvedValueOnce({ id: 's1', isDeleted: true });

      const result = await service.delete('team-1', 's1');

      // PersonalTask 이전이 호출되었는지 확인
      expect(mockTx.personalTask.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ statusId: 's1' }),
          data: { statusId: 's2' },
        }),
      );
      // 소프트 삭제 처리 확인
      expect(mockTx.taskStatusDef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 's1' },
          data: { isDeleted: true },
        }),
      );
      expect(result).toEqual({ message: '작업 상태가 삭제되었습니다.' });
    });

    it('should soft-delete without migration when no PersonalTasks use the status', async () => {
      const status = {
        id: 's1',
        teamId: 'team-1',
        name: '할일',
        category: TaskStatusCategory.BEFORE_START,
        isDeleted: false,
      };

      mockPrisma.taskStatusDef.findFirst.mockResolvedValueOnce(status as never);
      mockPrisma.taskStatusDef.count.mockResolvedValueOnce(2);

      // 트랜잭션 내부: 연결된 PersonalTask 없음
      mockTx.personalTask.count.mockResolvedValueOnce(0);
      mockTx.taskStatusDef.update.mockResolvedValueOnce({ id: 's1', isDeleted: true });

      const result = await service.delete('team-1', 's1');

      // updateMany(이전)는 호출되지 않아야 함
      expect(mockTx.personalTask.updateMany).not.toHaveBeenCalled();
      expect(mockTx.taskStatusDef.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isDeleted: true } }),
      );
      expect(result).toEqual({ message: '작업 상태가 삭제되었습니다.' });
    });
  });

  // ── createDefaultStatuses ────────────────────────────────────────────────

  describe('createDefaultStatuses', () => {
    it('should create exactly 3 default statuses (할일, 진행중, 완료)', async () => {
      mockPrisma.taskStatusDef.create.mockResolvedValue({} as never);

      await service.createDefaultStatuses('team-new');

      // 3개 상태가 생성되어야 함
      expect(mockPrisma.taskStatusDef.create).toHaveBeenCalledTimes(3);
    });

    it('should create statuses with correct categories', async () => {
      mockPrisma.taskStatusDef.create.mockResolvedValue({} as never);

      await service.createDefaultStatuses('team-new');

      const calls = mockPrisma.taskStatusDef.create.mock.calls as Array<[{ data: { category: string; name: string; isDefault: boolean } }]>;
      const categories = calls.map((c) => c[0].data.category);

      expect(categories).toContain(TaskStatusCategory.BEFORE_START);
      expect(categories).toContain(TaskStatusCategory.IN_PROGRESS);
      expect(categories).toContain(TaskStatusCategory.COMPLETED);
    });

    it('should create statuses with isDefault=true', async () => {
      mockPrisma.taskStatusDef.create.mockResolvedValue({} as never);

      await service.createDefaultStatuses('team-new');

      const calls = mockPrisma.taskStatusDef.create.mock.calls as Array<[{ data: { isDefault: boolean } }]>;
      const allDefault = calls.every((c) => c[0].data.isDefault === true);
      expect(allDefault).toBe(true);
    });

    it('should use provided transaction client when given', async () => {
      const txClient = {
        taskStatusDef: {
          create: mock(() => Promise.resolve({})),
        },
      };

      await service.createDefaultStatuses('team-new', txClient as never);

      // 제공된 tx 클라이언트를 사용해야 함
      expect(txClient.taskStatusDef.create).toHaveBeenCalledTimes(3);
      // prisma 직접 호출은 없어야 함
      expect(mockPrisma.taskStatusDef.create).not.toHaveBeenCalled();
    });
  });
});
