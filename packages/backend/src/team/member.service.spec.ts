import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { MemberService } from './member.service';
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../common/filters/business-exception';

const mockPrisma = {
  teamMembership: {
    findMany: mock(() => Promise.resolve([])),
  },
  member: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
  },
  $transaction: mock((ops: unknown) => Promise.resolve(ops)),
};

describe('MemberService', () => {
  let service: MemberService;

  beforeEach(() => {
    service = new MemberService(mockPrisma as never);
  });

  describe('findByTeam', () => {
    it('should return members for a team', async () => {
      const memberships = [
        {
          memberId: '1',
          partId: 'part-1',
          roles: ['MEMBER'],
          sortOrder: 0,
          part: { name: 'DX' },
          member: {
            id: '1',
            name: '홍길동',
            email: 'hong@test.com',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          memberId: '2',
          partId: 'part-1',
          roles: ['MEMBER'],
          sortOrder: 1,
          part: { name: 'DX' },
          member: {
            id: '2',
            name: '김철수',
            email: 'kim@test.com',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];
      mockPrisma.teamMembership.findMany.mockResolvedValueOnce(memberships as never);

      const result = await service.findByTeam('team-1');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('홍길동');
      expect(result[0].partName).toBe('DX');
    });

    it('should filter by partId when provided', async () => {
      mockPrisma.teamMembership.findMany.mockResolvedValueOnce([] as never);
      await service.findByTeam('team-1', 'part-1');
      expect(mockPrisma.teamMembership.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should throw on duplicate email', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce({ id: '1' } as never);

      try {
        await service.create({
          name: '테스트',
          email: 'existing@test.com',
          password: 'password123',
          roles: ['MEMBER'],
          partId: 'part-1',
        });
        expect(true).toBe(false); // should not reach
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('MEMBER_EMAIL_DUPLICATE');
      }
    });

    it('should create member and exclude password from result', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce(null);
      mockPrisma.member.create.mockResolvedValueOnce({
        id: '1',
        name: '테스트',
        email: 'new@test.com',
        password: 'hashed',
        roles: ['MEMBER'],
        part: { name: 'DX' },
      } as never);

      const result = await service.create({
        name: '테스트',
        email: 'new@test.com',
        password: 'password123',
        roles: ['MEMBER'],
        partId: 'part-1',
      });

      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('테스트');
    });
  });

  describe('update', () => {
    it('should throw if member not found', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce(null);

      try {
        await service.update('nonexistent', { name: '변경' });
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should update member', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce({ id: '1' } as never);
      mockPrisma.member.update.mockResolvedValueOnce({
        id: '1',
        name: '변경',
        password: 'hashed',
        part: { name: 'AX' },
      } as never);

      const result = await service.update('1', { name: '변경' });
      expect(result).not.toHaveProperty('password');
    });
  });
});
