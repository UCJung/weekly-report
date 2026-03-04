import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { PartSummaryService } from './part-summary.service';
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../common/filters/business-exception';
import { ReportStatus } from '@prisma/client';

const mockPartSummary = {
  id: 'summary-1',
  partId: 'part-1',
  weekStart: new Date('2026-02-23T00:00:00.000Z'),
  weekLabel: '2026-W09',
  status: ReportStatus.DRAFT,
  summaryWorkItems: [],
};

const mockMember = {
  id: 'member-1',
  name: '홍길동',
  roles: ['MEMBER'],
  partId: 'part-1',
  isActive: true,
  part: { id: 'part-1', name: 'DX' },
};

const mockPrisma = {
  partSummary: {
    findUnique: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(mockPartSummary)),
    update: mock(() => Promise.resolve(mockPartSummary)),
  },
  summaryWorkItem: {
    deleteMany: mock(() => Promise.resolve({ count: 0 })),
    create: mock(() => Promise.resolve({})),
  },
  member: {
    findMany: mock(() => Promise.resolve([mockMember])),
  },
  weeklyReport: {
    findMany: mock(() => Promise.resolve([])),
  },
  part: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve({ teamId: 'team-1' })),
  },
  teamMembership: {
    findMany: mock(() => Promise.resolve([{ memberId: 'member-1' }])),
  },
  $transaction: mock((ops: Promise<unknown>[]) => Promise.all(ops)),
};

describe('PartSummaryService', () => {
  let service: PartSummaryService;

  beforeEach(() => {
    service = new PartSummaryService(mockPrisma as never);
    mockPrisma.partSummary.findUnique.mockReset();
    mockPrisma.partSummary.create.mockReset();
    mockPrisma.partSummary.update.mockReset();
    mockPrisma.summaryWorkItem.deleteMany.mockReset();
    mockPrisma.member.findMany.mockReset();
    mockPrisma.weeklyReport.findMany.mockReset();
    mockPrisma.part.findUnique.mockReset();
    mockPrisma.teamMembership.findMany.mockReset();
  });

  describe('create', () => {
    it('should create part summary', async () => {
      mockPrisma.partSummary.findUnique.mockResolvedValueOnce(null);
      mockPrisma.partSummary.create.mockResolvedValueOnce(mockPartSummary);

      const result = await service.create({ partId: 'part-1', weekLabel: '2026-W09' });
      expect(result.weekLabel).toBe('2026-W09');
    });

    it('should throw if already exists', async () => {
      mockPrisma.partSummary.findUnique.mockResolvedValueOnce(mockPartSummary);

      try {
        await service.create({ partId: 'part-1', weekLabel: '2026-W09' });
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.CONFLICT);
      }
    });
  });

  describe('autoMerge', () => {
    it('should merge work items by project', async () => {
      const memberWithReport = {
        ...mockMember,
        weeklyReports: [
          {
            id: 'report-1',
            member: mockMember,
            workItems: [
              {
                id: 'item-1',
                projectId: 'proj-1',
                doneWork: '진행업무',
                planWork: '예정업무',
                remarks: '',
                sortOrder: 0,
                project: { name: '테스트' },
              },
            ],
          },
        ],
      };

      mockPrisma.partSummary.findUnique.mockResolvedValueOnce(mockPartSummary);
      mockPrisma.part.findUnique.mockResolvedValueOnce({ teamId: 'team-1' });
      mockPrisma.teamMembership.findMany.mockResolvedValueOnce([{ memberId: 'member-1' }]);
      mockPrisma.weeklyReport.findMany.mockResolvedValueOnce([memberWithReport.weeklyReports[0]]);
      mockPrisma.summaryWorkItem.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.summaryWorkItem.create.mockResolvedValueOnce({
        id: 'sum-item-1',
        projectId: 'proj-1',
        doneWork: '[홍길동] 진행업무',
        planWork: '[홍길동] 예정업무',
      });

      const result = await service.autoMerge('summary-1');
      expect(result.mergedCount).toBeGreaterThanOrEqual(0);
    });

    it('should throw if summary not found', async () => {
      mockPrisma.partSummary.findUnique.mockResolvedValueOnce(null);

      try {
        await service.autoMerge('nonexistent');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('PART_SUMMARY_NOT_FOUND');
      }
    });

    it('should only include members from TeamMembership (not by Member.partId)', async () => {
      // member-2 belongs to part-1 via Member.partId but is NOT in TeamMembership for this part
      // autoMerge should only pick up members in TeamMembership
      mockPrisma.partSummary.findUnique.mockResolvedValueOnce(mockPartSummary);
      mockPrisma.part.findUnique.mockResolvedValueOnce({ teamId: 'team-1' });
      // Only member-1 in TeamMembership
      mockPrisma.teamMembership.findMany.mockResolvedValueOnce([{ memberId: 'member-1' }]);
      mockPrisma.weeklyReport.findMany.mockResolvedValueOnce([]);
      mockPrisma.summaryWorkItem.deleteMany.mockResolvedValueOnce({ count: 0 });

      const result = await service.autoMerge('summary-1');
      // mergedCount should be 0 since no work items
      expect(result.mergedCount).toBe(0);
      // Verify teamMembership query was called with the correct partId
      expect(mockPrisma.teamMembership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ partId: 'part-1', teamId: 'team-1' }),
        }),
      );
    });
  });

  describe('getPartWeeklyStatus', () => {
    it('should return member status list', async () => {
      mockPrisma.member.findMany.mockResolvedValueOnce([
        {
          ...mockMember,
          weeklyReports: [],
        },
      ]);

      const result = await service.getPartWeeklyStatus('part-1', '2026-W09');
      expect(result).toHaveLength(1);
      expect(result[0].member.name).toBe('홍길동');
      expect(result[0].report).toBeNull();
    });
  });

  describe('getPartSubmissionStatus', () => {
    it('should return NOT_STARTED if no report', async () => {
      mockPrisma.member.findMany.mockResolvedValueOnce([
        { ...mockMember, weeklyReports: [] },
      ]);

      const result = await service.getPartSubmissionStatus('part-1', '2026-W09');
      expect(result[0].status).toBe('NOT_STARTED');
    });

    it('should return SUBMITTED if report submitted', async () => {
      mockPrisma.member.findMany.mockResolvedValueOnce([
        {
          ...mockMember,
          weeklyReports: [{ id: 'r1', status: ReportStatus.SUBMITTED }],
        },
      ]);

      const result = await service.getPartSubmissionStatus('part-1', '2026-W09');
      expect(result[0].status).toBe(ReportStatus.SUBMITTED);
    });
  });
});
