import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ReportService } from './report.service';
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../common/filters/business-exception';
import { ReportStatus } from '@prisma/client';

const mockWeeklyReport = {
  id: 'report-1',
  memberId: 'member-1',
  weekStart: new Date('2026-02-23T00:00:00.000Z'),
  weekLabel: '2026-W09',
  status: ReportStatus.DRAFT,
  workItems: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  weeklyReport: {
    findUnique: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(mockWeeklyReport)),
    update: mock(() => Promise.resolve(mockWeeklyReport)),
  },
  workItem: {
    deleteMany: mock(() => Promise.resolve({ count: 0 })),
  },
};

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(() => {
    service = new ReportService(mockPrisma as never);
    mockPrisma.weeklyReport.findUnique.mockReset();
    mockPrisma.weeklyReport.create.mockReset();
    mockPrisma.weeklyReport.update.mockReset();
    mockPrisma.workItem.deleteMany.mockReset();
  });

  describe('create', () => {
    it('should create a weekly report', async () => {
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce(null);
      mockPrisma.weeklyReport.create.mockResolvedValueOnce(mockWeeklyReport);

      const result = await service.create('member-1', { weekLabel: '2026-W09' });
      expect(result.weekLabel).toBe('2026-W09');
      expect(result.memberId).toBe('member-1');
    });

    it('should throw if weekly report already exists', async () => {
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce(mockWeeklyReport);

      try {
        await service.create('member-1', { weekLabel: '2026-W09' });
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('WEEKLY_REPORT_ALREADY_EXISTS');
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.CONFLICT);
      }
    });
  });

  describe('findById', () => {
    it('should throw if not found', async () => {
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce(null);

      try {
        await service.findById('nonexistent');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('WEEKLY_REPORT_NOT_FOUND');
      }
    });

    it('should return report', async () => {
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce(mockWeeklyReport);

      const result = await service.findById('report-1');
      expect(result.id).toBe('report-1');
    });
  });

  describe('findAndVerifyOwner', () => {
    it('should throw FORBIDDEN if memberId does not match', async () => {
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce({
        ...mockWeeklyReport,
        memberId: 'other-member',
      });

      try {
        await service.findAndVerifyOwner('report-1', 'member-1');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('WEEKLY_REPORT_FORBIDDEN');
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.FORBIDDEN);
      }
    });
  });

  describe('updateStatus', () => {
    it('should remove empty work items on SUBMIT', async () => {
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce(mockWeeklyReport);
      mockPrisma.workItem.deleteMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.weeklyReport.update.mockResolvedValueOnce({
        ...mockWeeklyReport,
        status: ReportStatus.SUBMITTED,
      });

      const result = await service.updateStatus('report-1', 'member-1', {
        status: ReportStatus.SUBMITTED,
      });
      expect(result.status).toBe(ReportStatus.SUBMITTED);
      expect(mockPrisma.workItem.deleteMany).toHaveBeenCalled();
    });

    it('should not remove work items on DRAFT revert', async () => {
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce({
        ...mockWeeklyReport,
        status: ReportStatus.SUBMITTED,
      });
      mockPrisma.weeklyReport.update.mockResolvedValueOnce(mockWeeklyReport);

      await service.updateStatus('report-1', 'member-1', {
        status: ReportStatus.DRAFT,
      });
      expect(mockPrisma.workItem.deleteMany).not.toHaveBeenCalled();
    });
  });
});
