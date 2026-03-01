import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { CarryForwardService } from './carry-forward.service';
import { ReportStatus } from '@prisma/client';

const mockPrisma = {
  weeklyReport: {
    findUnique: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(null)),
  },
  workItem: {
    count: mock(() => Promise.resolve(0)),
    create: mock(() => Promise.resolve(null)),
  },
  $transaction: mock((ops: Promise<unknown>[]) => Promise.all(ops)),
};

const prevReport = {
  id: 'prev-report',
  memberId: 'member-1',
  weekStart: new Date('2026-02-16T00:00:00.000Z'),
  weekLabel: '2026-W08',
  status: ReportStatus.SUBMITTED,
  workItems: [
    {
      id: 'item-1',
      projectId: 'proj-1',
      doneWork: '전주 진행',
      planWork: '전주 예정',
      remarks: '',
      sortOrder: 0,
    },
  ],
};

const targetReport = {
  id: 'target-report',
  memberId: 'member-1',
  weekStart: new Date('2026-02-23T00:00:00.000Z'),
  weekLabel: '2026-W09',
  status: ReportStatus.DRAFT,
};

describe('CarryForwardService', () => {
  let service: CarryForwardService;

  beforeEach(() => {
    service = new CarryForwardService(mockPrisma as never);
    mockPrisma.weeklyReport.findUnique.mockReset();
    mockPrisma.weeklyReport.create.mockReset();
    mockPrisma.workItem.count.mockReset();
    mockPrisma.workItem.create.mockReset();
  });

  it('should carry forward plan work to done work', async () => {
    mockPrisma.weeklyReport.findUnique
      .mockResolvedValueOnce(prevReport) // prev week
      .mockResolvedValueOnce(null); // target week (not exist)
    mockPrisma.weeklyReport.create.mockResolvedValueOnce(targetReport);
    mockPrisma.workItem.count.mockResolvedValueOnce(0);
    mockPrisma.workItem.create.mockResolvedValueOnce({
      id: 'new-item',
      weeklyReportId: 'target-report',
      projectId: 'proj-1',
      doneWork: '전주 예정', // planWork of prev → doneWork of new
      planWork: '',
      remarks: '',
      sortOrder: 0,
    });

    const result = await service.carryForward('member-1', { targetWeek: '2026-W09' });
    expect(result.createdItems).toHaveLength(1);
    expect(result.createdItems[0].doneWork).toBe('전주 예정');
    expect(result.createdItems[0].planWork).toBe('');
  });

  it('should return empty message if no prev report', async () => {
    mockPrisma.weeklyReport.findUnique
      .mockResolvedValueOnce(null) // prev week empty
      .mockResolvedValueOnce(null); // target week
    mockPrisma.weeklyReport.create.mockResolvedValueOnce(targetReport);

    const result = await service.carryForward('member-1', { targetWeek: '2026-W09' });
    expect(result.createdItems).toHaveLength(0);
    expect(result.message).toContain('전주 예정업무가 없습니다');
  });

  it('should filter by sourceWorkItemIds', async () => {
    mockPrisma.weeklyReport.findUnique
      .mockResolvedValueOnce({
        ...prevReport,
        workItems: [
          { id: 'item-1', projectId: 'proj-1', planWork: '예정1', doneWork: '', remarks: '', sortOrder: 0 },
          { id: 'item-2', projectId: 'proj-2', planWork: '예정2', doneWork: '', remarks: '', sortOrder: 1 },
        ],
      })
      .mockResolvedValueOnce(targetReport);
    mockPrisma.workItem.count.mockResolvedValueOnce(0);
    mockPrisma.workItem.create.mockResolvedValueOnce({
      id: 'new-1', doneWork: '예정1', planWork: '', remarks: '', sortOrder: 0,
    });

    const result = await service.carryForward('member-1', {
      targetWeek: '2026-W09',
      sourceWorkItemIds: ['item-1'], // only item-1
    });
    expect(result.createdItems).toHaveLength(1);
  });
});
